'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'
import { timeAgo } from '@/types'
import type { ChatMessage } from '@/types'

interface Props { requestId: string; fighterName: string }

export function ChatBox({ requestId, fighterName }: Props) {
  const { profile } = useUser()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput]       = useState('')
  const [sending, setSending]   = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    const { data } = await supabase
      .from('chat_messages').select('*')
      .eq('request_id', requestId)
      .order('created_at', { ascending: true })
    setMessages((data as ChatMessage[]) || [])
  }

  useEffect(() => {
    load()
    const ch = supabase.channel(`chat-${requestId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `request_id=eq.${requestId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new as ChatMessage])
      }).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [requestId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMsg = async (content?: string) => {
    const text = (content || input).trim()
    if (!text) return
    setSending(true)
    await supabase.from('chat_messages').insert({
      request_id: requestId,
      sender_id: profile?.id || null,
      sender_name: profile?.username || 'User',
      sender_role: profile?.role || 'client',
      content: text,
    })
    setInput('')
    setSending(false)
  }

  const quickReplies = [
    `Add me on Roblox: ${profile?.roblox_username || profile?.username}`,
    'I\'m ready. What server?',
    'Copy username ↑ and join me',
    'On my way — 1 min',
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Quick replies for fighter */}
      {profile?.role === 'fighter' && (
        <div style={{ padding: '10px 16px', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {quickReplies.map(r => (
            <button key={r} onClick={() => sendMsg(r)} style={{ background: 'rgba(124,58,237,.1)', border: '1px solid rgba(124,58,237,.3)', color: 'var(--pg)', padding: '4px 10px', fontFamily: "'Share Tech Mono', monospace", fontSize: 10, cursor: 'pointer', letterSpacing: 1, transition: 'all .2s', whiteSpace: 'nowrap' }}>
              {r.length > 30 ? r.substring(0, 30) + '…' : r}
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
        {/* System welcome */}
        <div className="chat-bubble system">
          ⚡ {fighterName} accepted your request. Start coordinating now.
        </div>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace", fontSize: 12, padding: 20 }}>
            No messages yet. Say something!
          </div>
        )}

        {messages.map(m => {
          const isMe = m.sender_id === profile?.id
          return (
            <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', gap: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>
                  {isMe ? 'You' : m.sender_name}
                </span>
                <span className={`role-badge role-${m.sender_role}`}>{m.sender_role}</span>
                <span style={{ fontSize: 10, color: 'var(--dim)', fontFamily: "'Share Tech Mono', monospace" }}>{timeAgo(m.created_at)}</span>
              </div>
              <div className={`chat-bubble ${isMe ? 'sent' : 'recv'}`}>{m.content}</div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', gap: 8 }}>
        <input
          className="finput" style={{ flex: 1 }} value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMsg()}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button className="btn-form" style={{ width: 'auto', padding: '0 20px', fontSize: 14, clipPath: 'none' }} onClick={() => sendMsg()} disabled={sending || !input.trim()}>
          {sending ? '…' : '⚡'}
        </button>
      </div>
    </div>
  )
}
