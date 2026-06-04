import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Node, Edge } from '@xyflow/react';
import type { DiagramType } from '../types';

/* ── types ─────────────────────────────────────────────────────────────── */

export interface CollabPeer {
  sessionId:   string;
  displayName: string;
  color:       string;
}

export interface CollabSnapshot {
  nodes:       Node[];
  edges:       Edge[];
  diagramType: DiagramType;
}

/* ── helpers ────────────────────────────────────────────────────────────── */

const PEER_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#ef4444',
];

function peerColor(id: string): string {
  let h = 0;
  for (const c of id) h = Math.imul(31, h) + c.charCodeAt(0);
  return PEER_COLORS[Math.abs(h) % PEER_COLORS.length];
}

function getOrCreateSessionId(): string {
  const KEY = 'uml_collab_session';
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
    return id;
  } catch {
    // sessionStorage blocked (private mode / iframe sandbox) — use ephemeral id
    return crypto.randomUUID();
  }
}

/* ── hook ───────────────────────────────────────────────────────────────── */

export interface UseCollabReturn {
  peers:        CollabPeer[];
  isConnected:  boolean;
  sessionId:    string;
  myColor:      string;
  /** Broadcast the full diagram state to all peers */
  broadcastState: (snapshot: CollabSnapshot) => void;
  /** Update the stored snapshot without broadcasting (keeps hello-sync up to date) */
  stashState: (snapshot: CollabSnapshot) => void;
}

export function useCollab(
  roomId:          string | null,
  displayName:     string,
  onRemoteUpdate:  (snapshot: CollabSnapshot) => void,
): UseCollabReturn {
  const [sid]           = useState(() => getOrCreateSessionId());
  const myColor         = peerColor(sid);
  const channelRef      = useRef<RealtimeChannel | null>(null);
  const snapshotRef     = useRef<CollabSnapshot | null>(null);   // latest known state
  const onUpdateRef     = useRef(onRemoteUpdate);

  const [peers,       setPeers]       = useState<CollabPeer[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  // Keep callback ref fresh without re-subscribing the channel
  useEffect(() => { onUpdateRef.current = onRemoteUpdate; }, [onRemoteUpdate]);

  useEffect(() => {
    if (!roomId || !isSupabaseConfigured) return;

    const channel = supabase.channel(`collab_room_${roomId}`, {
      config: { presence: { key: sid } },
    });
    channelRef.current = channel;

    channel
      /* ── diagram state broadcast ── */
      .on('broadcast', { event: 'diagram' }, ({ payload }: {
        payload: { senderId: string; snapshot: CollabSnapshot }
      }) => {
        if (payload.senderId !== sid) {
          snapshotRef.current = payload.snapshot;
          onUpdateRef.current(payload.snapshot);
        }
      })

      /* ── new peer joined — send them current state ── */
      .on('broadcast', { event: 'hello' }, ({ payload }: {
        payload: { senderId: string }
      }) => {
        if (payload.senderId !== sid && snapshotRef.current) {
          channel.send({
            type: 'broadcast', event: 'diagram',
            payload: { senderId: sid, snapshot: snapshotRef.current },
          });
        }
      })

      /* ── presence sync — who's in the room ── */
      .on('presence', { event: 'sync' }, () => {
        const raw = channel.presenceState<{ displayName: string }>();
        setPeers(
          Object.entries(raw)
            .filter(([id]) => id !== sid)
            .map(([id, presences]) => ({
              sessionId:   id,
              displayName: (presences[0] as { displayName: string }).displayName ?? 'Guest',
              color:       peerColor(id),
            }))
        );
      })

      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          await channel.track({ displayName });
          // Ask existing peers to send us their state
          channel.send({ type: 'broadcast', event: 'hello', payload: { senderId: sid } });
        }
      });

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
      setIsConnected(false);
      setPeers([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);   // intentionally omit displayName — reconnect only on roomId change

  /* Update presence display name when it changes (e.g. after sign-in) */
  useEffect(() => {
    if (channelRef.current && isConnected) {
      channelRef.current.track({ displayName });
    }
  }, [displayName, isConnected]);

  const broadcastState = useCallback((snapshot: CollabSnapshot) => {
    snapshotRef.current = snapshot;
    channelRef.current?.send({
      type: 'broadcast', event: 'diagram',
      payload: { senderId: sid, snapshot },
    });
  }, [sid]);

  const stashState = useCallback((snapshot: CollabSnapshot) => {
    snapshotRef.current = snapshot;
  }, []);

  return { peers, isConnected, sessionId: sid, myColor, broadcastState, stashState };
}
