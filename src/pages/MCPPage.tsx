import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, Wrench, Database, Play, ChevronRight, ChevronDown, Copy, Check, RefreshCw, Loader2, BookOpen, Zap, Terminal, Code } from 'lucide-react';
import { cn } from '../lib/utils';
import { mcpAPI, MCPTool, MCPResource, MCPToolCallResult } from '../services/api';

// ─── Tool Call Card ──────────────────────────────────────────────────
function ToolCallCard({ tool, onCall, result, calling }: {
  tool: MCPTool; onCall: (args: Record<string, any>) => void; result: MCPToolCallResult | null; calling: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [args, setArgs] = useState<Record<string, any>>({});
  const props = tool.inputSchema?.properties || {};
  const required = tool.inputSchema?.required || [];

  return (
    <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
      <button onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-bg-hover transition-colors">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
          <Wrench className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-text-primary font-mono">{tool.name}</div>
          <div className="text-[10px] text-text-tertiary line-clamp-1">{tool.description}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {required.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{required.length} required</span>
          )}
          <ChevronDown className={cn('w-4 h-4 text-text-muted transition-transform', expanded && 'rotate-180')} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            <div className="px-4 pb-4 space-y-3 border-t border-border-primary pt-3">
              {/* Description */}
              <p className="text-xs text-text-secondary leading-relaxed">{tool.description}</p>

              {/* Input Schema */}
              {Object.keys(props).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">Parameters</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(props).map(([key, schema]: [string, any]) => (
                      <div key={key} className="bg-bg-elevated rounded-lg p-2.5">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-text-primary">{key}</span>
                          {required.includes(key) && <span className="text-[9px] text-red-400">required</span>}
                          <span className="text-[9px] text-text-muted">{schema.type || 'any'}</span>
                        </div>
                        {schema.description && <p className="text-[10px] text-text-tertiary mb-1.5">{schema.description}</p>}
                        {schema.enum ? (
                          <select value={args[key] || schema.default || ''} onChange={(e) => setArgs({ ...args, [key]: e.target.value })}
                            className="w-full bg-bg-primary rounded border border-border-primary px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary">
                            {schema.enum.map((v: string) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        ) : schema.type === 'boolean' ? (
                          <button onClick={() => setArgs({ ...args, [key]: !args[key] })}
                            className={cn('px-3 py-1.5 rounded text-xs font-medium transition-all',
                              args[key] ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-bg-primary text-text-tertiary border border-border-primary')}>
                            {args[key] ? 'true' : 'false'}
                          </button>
                        ) : schema.type === 'integer' || schema.type === 'number' ? (
                          <input type="number" value={args[key] ?? schema.default ?? ''}
                            onChange={(e) => setArgs({ ...args, [key]: Number(e.target.value) })}
                            placeholder={String(schema.default ?? '')}
                            className="w-full bg-bg-primary rounded border border-border-primary px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary" />
                        ) : key.toLowerCase().includes('text') || key.toLowerCase().includes('context') ? (
                          <textarea value={args[key] ?? ''} onChange={(e) => setArgs({ ...args, [key]: e.target.value })}
                            placeholder={schema.default || `Enter ${key}...`}
                            rows={3}
                            className="w-full bg-bg-primary rounded border border-border-primary px-2 py-1.5 text-xs text-text-primary resize-none focus:outline-none focus:border-accent-primary" />
                        ) : (
                          <input type={key.toLowerCase().includes('key') ? 'password' : 'text'}
                            value={args[key] ?? ''} onChange={(e) => setArgs({ ...args, [key]: e.target.value })}
                            placeholder={schema.default || `Enter ${key}...`}
                            className="w-full bg-bg-primary rounded border border-border-primary px-2 py-1.5 text-xs text-text-primary focus:outline-none focus:border-accent-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Call Button */}
              <button onClick={() => onCall(args)} disabled={calling}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50">
                {calling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {calling ? 'Calling...' : 'Call Tool'}
              </button>

              {/* Result */}
              {result && (
                <div className={cn('rounded-lg p-3 text-xs font-mono whitespace-pre-wrap max-h-80 overflow-y-auto',
                  result.success ? 'bg-green-500/5 border border-green-500/20 text-green-300' : 'bg-red-500/5 border border-red-500/20 text-red-400')}>
                  {result.content || result.error || JSON.stringify(result, null, 2)}
                  {result.time_ms !== undefined && (
                    <div className="mt-2 text-[10px] text-text-muted">Completed in {result.time_ms.toFixed(0)}ms</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Resource Card ───────────────────────────────────────────────────
function ResourceCard({ resource, onRead, content, loading }: {
  resource: MCPResource; onRead: () => void; content: string | null; loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-bg-secondary rounded-xl border border-border-primary overflow-hidden">
      <button onClick={() => { setOpen(!open); if (!content && !loading) onRead(); }}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-bg-hover transition-colors">
        <Database className="w-4 h-4 text-emerald-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-text-primary font-mono truncate">{resource.uri}</div>
          <div className="text-[10px] text-text-tertiary">{resource.name} • {resource.mimeType}</div>
        </div>
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-text-muted shrink-0" /> :
          <ChevronDown className={cn('w-3.5 h-3.5 text-text-muted transition-transform', open && 'rotate-180')} />}
      </button>
      <AnimatePresence>
        {open && content && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
            <pre className="px-3 pb-3 text-[11px] text-text-secondary font-mono whitespace-pre-wrap max-h-48 overflow-y-auto bg-bg-elevated rounded-lg mx-3 mb-3 p-2">{content}</pre>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main MCP Page ───────────────────────────────────────────────────
export default function MCPPage() {
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [resources, setResources] = useState<MCPResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [toolResults, setToolResults] = useState<Record<string, MCPToolCallResult>>({});
  const [toolCalling, setToolCalling] = useState<Record<string, boolean>>({});
  const [resourceContents, setResourceContents] = useState<Record<string, string>>({});
  const [resourceLoading, setResourceLoading] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'tools' | 'resources' | 'config'>('tools');
  const [copied, setCopied] = useState(false);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([mcpAPI.listTools(), mcpAPI.listResources()])
      .then(([t, r]) => { setTools(t.tools); setResources(r.resources); })
      .catch(() => setError('Failed to connect to MCP server. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const handleCallTool = async (toolName: string, args: Record<string, any>) => {
    setToolCalling({ ...toolCalling, [toolName]: true });
    try {
      const result = await mcpAPI.callTool(toolName, args);
      setToolResults({ ...toolResults, [toolName]: result });
    } catch (err: any) {
      setToolResults({ ...toolResults, [toolName]: { success: false, error: err.message } });
    } finally {
      setToolCalling({ ...toolCalling, [toolName]: false });
    }
  };

  const handleReadResource = async (uri: string) => {
    setResourceLoading({ ...resourceLoading, [uri]: true });
    try {
      const result = await mcpAPI.readResource(uri);
      setResourceContents({ ...resourceContents, [uri]: result.content });
    } catch (err: any) {
      setResourceContents({ ...resourceContents, [uri]: `Error: ${err.message}` });
    } finally {
      setResourceLoading({ ...resourceLoading, [uri]: false });
    }
  };

  const configSnippet = `{
  "mcpServers": {
    "ragstudio": {
      "command": "python",
      "args": ["backend/mcp_server.py"],
      "cwd": "/path/to/RagStudio"
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(configSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-border-primary bg-bg-secondary/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Network className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-text-primary">MCP Server</h1>
              <p className="text-xs text-text-tertiary">Expose your RAG pipeline as Model Context Protocol tools</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-2 text-sm text-red-400">
          <RefreshCw className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
          {[
            { id: 'tools' as const, label: 'Tools', icon: Wrench, count: tools.length },
            { id: 'resources' as const, label: 'Resources', icon: Database, count: resources.length },
            { id: 'config' as const, label: 'Configuration', icon: Code },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                activeTab === tab.id ? 'bg-accent-primary text-white' : 'bg-bg-secondary text-text-secondary hover:text-text-primary border border-border-primary')}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full',
                  activeTab === tab.id ? 'bg-white/20' : 'bg-bg-elevated')}>{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tools Tab */}
        {activeTab === 'tools' && (
          <div className="space-y-3">
            <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
              <div className="flex items-center gap-2 mb-1">
                <Terminal className="w-4 h-4 text-accent-primary" />
                <h3 className="text-sm font-semibold text-text-primary">MCP Tools</h3>
              </div>
              <p className="text-xs text-text-tertiary">
                These tools are available for any MCP-compatible client (Claude Desktop, custom agents, etc.).
                You can also call them directly from this interface.
              </p>
            </div>
            {tools.map((tool) => (
              <ToolCallCard key={tool.name} tool={tool} result={toolResults[tool.name] || null}
                calling={toolCalling[tool.name] || false} onCall={(args) => handleCallTool(tool.name, args)} />
            ))}
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="space-y-3">
            <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
              <div className="flex items-center gap-2 mb-1">
                <BookOpen className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-text-primary">MCP Resources</h3>
              </div>
              <p className="text-xs text-text-tertiary">
                Read-only data sources that MCP clients can browse. Click to expand and view contents.
              </p>
            </div>
            {resources.map((resource) => (
              <ResourceCard key={resource.uri} resource={resource}
                content={resourceContents[resource.uri] || null}
                loading={resourceLoading[resource.uri] || false}
                onRead={() => handleReadResource(resource.uri)} />
            ))}
          </div>
        )}

        {/* Config Tab */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-text-primary">How It Works</h3>
              </div>
              <p className="text-xs text-text-tertiary mb-4">
                The Model Context Protocol (MCP) lets any AI assistant discover and call your RAG pipeline as tools.
                Your vector search, document ingestion, and generation become available to Claude, custom agents, and more.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {[
                  { icon: Wrench, title: 'Tools', desc: 'Actions the LLM can take (search, store, generate)', color: 'text-blue-400' },
                  { icon: Database, title: 'Resources', desc: 'Data the LLM can read (collections, health)', color: 'text-emerald-400' },
                  { icon: Terminal, title: 'Stdio + HTTP', desc: 'Run locally or as a web service', color: 'text-purple-400' },
                ].map((item) => (
                  <div key={item.title} className="bg-bg-elevated rounded-lg p-3 text-center">
                    <item.icon className={cn('w-5 h-5 mx-auto mb-1.5', item.color)} />
                    <div className="text-xs font-semibold text-text-primary mb-0.5">{item.title}</div>
                    <div className="text-[10px] text-text-tertiary">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary">Claude Desktop Config</h3>
                <button onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-elevated border border-border-primary text-xs text-text-secondary hover:text-text-primary transition-all">
                  {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="bg-bg-primary rounded-lg p-4 text-xs text-text-secondary font-mono overflow-x-auto whitespace-pre-wrap">
                {configSnippet}
              </pre>
            </div>

            <div className="bg-bg-secondary rounded-xl border border-border-primary p-4">
              <h3 className="text-sm font-semibold text-text-primary mb-3">CLI Usage</h3>
              <div className="bg-bg-primary rounded-lg p-4 text-xs font-mono text-text-secondary space-y-2">
                <div><span className="text-text-muted">$</span> pip install mcp</div>
                <div><span className="text-text-muted">#</span> Run as stdio server (for Claude Desktop)</div>
                <div><span className="text-text-muted">$</span> python backend/mcp_server.py</div>
                <div className="mt-2"><span className="text-text-muted">#</span> Run as HTTP server (for web apps)</div>
                <div><span className="text-text-muted">$</span> python backend/mcp_server.py --http 9000</div>
                <div className="mt-2"><span className="text-text-muted">#</span> Test with MCP Inspector</div>
                <div><span className="text-text-muted">$</span> npx -y @modelcontextprotocol/inspector -- python backend/mcp_server.py</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
