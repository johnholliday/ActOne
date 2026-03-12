-- Add conversations and chat_messages tables for AI chat

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX conversations_project_id_idx ON conversations(project_id);
CREATE INDEX conversations_user_id_idx ON conversations(user_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    token_count INTEGER,
    tool_calls JSONB,
    model_used TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX chat_messages_conversation_id_idx ON chat_messages(conversation_id);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Conversations: user owns their own conversations
CREATE POLICY conversations_select ON conversations FOR SELECT TO authenticated
    USING (user_id = (select auth.uid()));

CREATE POLICY conversations_insert ON conversations FOR INSERT TO authenticated
    WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY conversations_update ON conversations FOR UPDATE TO authenticated
    USING (user_id = (select auth.uid()));

CREATE POLICY conversations_delete ON conversations FOR DELETE TO authenticated
    USING (user_id = (select auth.uid()));

-- Chat messages: access through owning conversation
CREATE POLICY chat_messages_select ON chat_messages FOR SELECT TO authenticated
    USING (conversation_id IN (SELECT id FROM conversations WHERE user_id = (select auth.uid())));

CREATE POLICY chat_messages_insert ON chat_messages FOR INSERT TO authenticated
    WITH CHECK (conversation_id IN (SELECT id FROM conversations WHERE user_id = (select auth.uid())));

CREATE POLICY chat_messages_update ON chat_messages FOR UPDATE TO authenticated
    USING (conversation_id IN (SELECT id FROM conversations WHERE user_id = (select auth.uid())));

CREATE POLICY chat_messages_delete ON chat_messages FOR DELETE TO authenticated
    USING (conversation_id IN (SELECT id FROM conversations WHERE user_id = (select auth.uid())));
