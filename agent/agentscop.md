# AgentScope — Complete Documentation Reference

> **Source:** https://doc.agentscope.io/  
> **Version:** Stable (v1.0) — Current release: 1.0.18  
> **By:** Alibaba  
> **Scraped:** March 28, 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Installation](#2-installation)
3. [Key Concepts](#3-key-concepts)
4. [Message](#4-message)
5. [Model APIs](#5-model-apis)
6. [Prompt Formatter](#6-prompt-formatter)
7. [Memory](#7-memory)
8. [Long-Term Memory](#8-long-term-memory)
9. [Tool & Toolkit](#9-tool--toolkit)
10. [MCP (Model Context Protocol)](#10-mcp-model-context-protocol)
11. [Agent Skill](#11-agent-skill)
12. [Agent](#12-agent)
13. [State / Session Management](#13-state--session-management)
14. [Agent Hooks](#14-agent-hooks)
15. [Middleware](#15-middleware)
16. [A2A Agent](#16-a2a-agent)
17. [Realtime Agent](#17-realtime-agent)
18. [Workflows](#18-workflows)
19. [Pipeline](#19-pipeline)
20. [Plan](#20-plan)
21. [RAG](#21-rag)
22. [AgentScope Studio](#22-agentscope-studio)
23. [Tracing](#23-tracing)
24. [Evaluation](#24-evaluation)
25. [Embedding](#25-embedding)
26. [TTS](#26-tts)
27. [Token](#27-token)

---

## 1. Overview

AgentScope is a **full-featured, production-ready multi-agent framework** built by Alibaba. It is designed to address practical engineering challenges rather than provide formal research definitions. It is positioned as a complete alternative to frameworks like LangGraph, offering:

- A rich, async-first agent runtime
- Out-of-the-box ReAct agents
- Full multi-agent orchestration (pipelines, hubs, handoffs, routing)
- MCP (Model Context Protocol) support
- Built-in RAG with multimodal support
- Memory backends (in-memory, SQLAlchemy/SQL DBs, Redis)
- OpenTelemetry-based tracing
- A local Studio UI for visualization and project management
- A2A (Agent-to-Agent) protocol support
- Realtime streaming agents

GitHub: https://github.com/agentscope-ai/agentscope

---

## 2. Installation

**Requirement:** Python 3.10 or higher.

### From PyPI
```bash
pip install agentscope
```

### From Source
```bash
git clone -b main https://github.com/agentscope-ai/agentscope
cd agentscope
pip install -e .
```

### Verify Installation
```python
import agentscope
print(agentscope.__version__)
# 1.0.18
```

### Extra Dependencies

| Extra | Description |
|---|---|
| `full` | Extra model APIs and tool functions |
| `dev` | Testing and documentation tools |

**Install full (Windows):**
```bash
pip install agentscope[full]
```

**Install full (Mac/Linux):**
```bash
pip install agentscope\[full\]
```

---

## 3. Key Concepts

### State
State management maintains snapshots of objects' runtime data. AgentScope **separates object initialization from state management**, allowing objects to be restored to different states using `load_state_dict` and `state_dict` methods. The following objects are all stateful: agent, memory, long-term memory, toolkit.

### Message
`Message` is the **fundamental data structure** in AgentScope, used to:
- Exchange information between agents
- Display information in the UI
- Store information in memory
- Act as a unified medium between AgentScope and different LLM APIs

### Tool
A tool is any callable object — function, partial function, instance method, class method, static method, or callable instance with `__call__`. Tools can be async or sync, streaming or non-streaming.

### Agent
Agent behaviors are abstracted into three core functions in `AgentBase`:
- `reply` — Handle incoming message(s) and return a response message
- `observe` — Receive message(s) without returning a response
- `print` — Display message(s) to terminal, web UI, etc.

An additional `handle_interrupt` function is provided for realtime steering. The `ReActAgentBase` extends this with `_reasoning` and `_acting`.

### Formatter
Formatter is the **core component for LLM compatibility**, converting `Msg` objects into the required format for each LLM API. It also handles prompt engineering, truncation, and message validation. A "multi-agent formatter" handles scenarios where multiple identities appear in messages (e.g., games, multi-person chats).

### Long-Term Memory
AgentScope provides two long-term memory modes (requirement-driven approach):
- **agent_control**: agent manages its own long-term memory
- **static_control**: automatic retrieve/record at begin/end of each reply
- **both**: activates both modes simultaneously

---

## 4. Message

The `Msg` class is the core message type.

### Fields

| Field | Type | Description |
|---|---|---|
| `name` | `str` | Sender name/identity |
| `role` | `Literal["system","assistant","user"]` | Sender role |
| `content` | `str \| list[ContentBlock]` | Message data (string or list of blocks) |
| `metadata` | `dict \| None` | Additional metadata; recommended for structured output; NOT included in prompt construction |

### Content Block Types

| Class | Use Case |
|---|---|
| `TextBlock` | Pure text |
| `ThinkingBlock` | Reasoning/thinking content (for reasoning models) |
| `ImageBlock` | Image data (URL or base64) |
| `AudioBlock` | Audio data (URL or base64) |
| `VideoBlock` | Video data (URL or base64) |
| `ToolUseBlock` | Tool call request |
| `ToolResultBlock` | Tool call result |

### Creating Messages
```python
from agentscope.message import Msg, TextBlock, ImageBlock, Base64Source, URLSource

# Simple text message
msg = Msg(name="Jarvis", role="assistant", content="Hi! How can I help you?")

# Multimodal message
msg = Msg(
    name="Jarvis",
    role="assistant",
    content=[
        TextBlock(type="text", text="Here is an image:"),
        ImageBlock(type="image", source=URLSource(type="url", url="https://example.com/img.jpg")),
    ],
)

# Tool call message
msg_tool_call = Msg(
    name="Jarvis",
    role="assistant",
    content=[
        ToolUseBlock(type="tool_use", id="343", name="get_weather", input={"location": "Beijing"}),
    ],
)

# Tool result message
msg_tool_res = Msg(
    name="system",
    role="system",
    content=[
        ToolResultBlock(type="tool_result", id="343", name="get_weather",
                        output="The weather in Beijing is sunny, 25°C."),
    ],
)
```

### Serialization
```python
serialized = msg.to_dict()          # -> dict
new_msg = Msg.from_dict(serialized) # -> Msg
```

### Utility Methods

| Method | Description |
|---|---|
| `get_text_content()` | Gathers all `TextBlock` text into a single string |
| `get_content_blocks(block_type)` | Returns list of blocks of specified type |
| `has_content_blocks(block_type)` | Checks if message contains specified block type |

---

## 5. Model APIs

### Supported Providers

| API | Class | Streaming | Tools | Vision | Reasoning | Compatible With |
|---|---|---|---|---|---|---|
| OpenAI | `OpenAIChatModel` | ✅ | ✅ | ✅ | ✅ | vLLM, DeepSeek |
| DashScope | `DashScopeChatModel` | ✅ | ✅ | ✅ | ✅ | — |
| Anthropic | `AnthropicChatModel` | ✅ | ✅ | ✅ | ✅ | — |
| Gemini | `GeminiChatModel` | ✅ | ✅ | ✅ | ✅ | — |
| Ollama | `OllamaChatModel` | ✅ | ✅ | ✅ | ✅ | — |

### Using a Model
```python
from agentscope.model import DashScopeChatModel

model = DashScopeChatModel(
    model_name="qwen-max",
    api_key=os.environ["DASHSCOPE_API_KEY"],
    stream=False,
    generate_kwargs={"temperature": 0.3, "max_tokens": 1000},  # Optional
)

res = await model(messages=[{"role": "user", "content": "Hi!"}])
msg_res = Msg("Friday", res.content, "assistant")
```

### Streaming Mode
When `stream=True`, `__call__` returns an **async generator** that yields cumulative `ChatResponse` chunks.

```python
model = DashScopeChatModel(model_name="qwen-max", api_key=..., stream=True)
generator = await model(messages=[...])
async for chunk in generator:
    print(chunk)
```

### Reasoning Models
Set `enable_thinking=True`. The response will contain a `ThinkingBlock` with the model's reasoning process.

### Tools API (Unified Interface)
Models accept a list of tool JSON schemas in the `__call__` method:
```python
json_schemas = [
    {
        "type": "function",
        "function": {
            "name": "google_search",
            "description": "Search on Google.",
            "parameters": {"type": "object", "properties": {"query": {"type": "string"}}},
        },
    }
]
res = await model(messages=[...], tools=json_schemas)
```

### `ChatResponse` Object
Contains: `content` (list of blocks), `id`, `created_at`, `type`, `usage`, `metadata`.

### OpenAI-Compatible Endpoints (vLLM, DeepSeek, etc.)
```python
OpenAIChatModel(client_kwargs={"base_url": "http://localhost:8000/v1"})
```

---

## 6. Prompt Formatter

Formatters convert `Msg` objects into the format required by each LLM API. Two families:

- **Chat formatters** (`DashScopeChatFormatter`, `AnthropicChatFormatter`, etc.) — for two-party (user + agent) conversations; use `role` to distinguish parties.
- **Multi-Agent formatters** (`DashScopeMultiAgentFormatter`, `AnthropicMultiAgentFormatter`, etc.) — for multi-party conversations; combine conversation history into a single user message with `name` labels.

### Example Multi-Agent Prompt
```python
formatter = DashScopeMultiAgentFormatter()
prompt = await formatter.format([
    Msg("system", "You're Bob.", "system"),
    Msg("Alice", "Hi!", "user"),
    Msg("Bob", "Hi! Nice to meet you.", "assistant"),
])
# Produces a user message containing the full conversation history labeled by name
```

---

## 7. Memory

Memory stores `Msg` objects and supports marking/filtering for fine-grained management.

### Memory Backends

| Class | Description |
|---|---|
| `InMemoryMemory` | Simple in-memory storage |
| `AsyncSQLAlchemyMemory` | SQLAlchemy-based; supports SQLite, PostgreSQL, MySQL, etc. |
| `RedisMemory` | Redis-based storage |

All support: user/session management, marks, state_dict persistence.

### Marks
A **mark** is a string label attached to messages. Used for filtering, categorizing, and selective retrieval (e.g., hint messages, compressed summaries).

```python
memory = InMemoryMemory()
await memory.add(Msg("Alice", "Generate a report", "user"))
await memory.add(Msg("system", "<system-hint>Plan first</system-hint>", "system"), marks="hint")

# Retrieve only hint messages
msgs = await memory.get_memory(mark="hint")

# Delete by mark
deleted_count = await memory.delete_by_mark("hint")
```

### SQLAlchemy Memory (Production with FastAPI)
```python
from sqlalchemy.ext.asyncio import create_async_engine
engine = create_async_engine("sqlite+aiosqlite:///./db.db", pool_size=10)
memory = AsyncSQLAlchemyMemory(engine_or_session=engine, user_id="u1", session_id="s1")
```

### Redis Memory
```python
memory = RedisMemory(connection_pool=redis_pool, user_id="u1", session_id="s1")
```

### Custom Memory
Inherit from `MemoryBase` and implement: `add`, `delete`, `delete_by_mark`, `size`, `clear`, `get_memory`, `update_messages_mark`, `state_dict`, `load_state_dict`.

---

## 8. Long-Term Memory

Long-term memory allows agents to persist and retrieve knowledge across conversations. AgentScope provides two modes:

- **agent_control**: The agent itself decides when to record and retrieve from long-term memory via tool calls.
- **static_control**: Automatic retrieval at the start of each reply and automatic recording at the end.

Set via `long_term_memory_mode` parameter in `ReActAgent`:
```python
agent = ReActAgent(
    ...
    long_term_memory=my_ltm,
    long_term_memory_mode="agent_control",  # or "static_control" or "both"
)
```

---

## 9. Tool & Toolkit

### Tool Function Template
```python
def tool_function(a: int, b: str) -> ToolResponse:
    """Short description of the tool.

    Args:
        a (int):
            Description of first param.
        b (str):
            Description of second param.
    """
    return ToolResponse(content=[TextBlock(type="text", text="result")])
```

Tools can be sync/async and streaming/non-streaming. Instance and class methods are also supported.

### Built-in Tools

Available in `agentscope.tool`:
- `execute_python_code`
- `execute_shell_command`
- `view_text_file`
- `write_text_file`
- `insert_text_file`
- `dashscope_text_to_image`, `dashscope_text_to_audio`, `dashscope_image_to_text`
- `openai_text_to_image`, `openai_text_to_audio`, `openai_edit_image`, `openai_create_image_variation`, `openai_image_to_text`, `openai_audio_to_text`

### Toolkit Class

The `Toolkit` manages tool functions, extracts JSON Schema from docstrings, and executes them.

```python
from agentscope.tool import Toolkit

toolkit = Toolkit()
toolkit.register_tool_function(my_search)

# With preset arguments (hide sensitive params from model)
toolkit.register_tool_function(my_search, preset_kwargs={"api_key": "xxx"})

# Execute a tool call
res = await toolkit.call_tool_function(
    ToolUseBlock(type="tool_use", id="123", name="my_search", input={"query": "AI"})
)
async for tool_response in res:
    print(tool_response)
```

### Dynamic JSON Schema Extension
Extend tool schemas at runtime (e.g., add a `thinking` field for CoT):
```python
from pydantic import BaseModel, Field

class ThinkingModel(BaseModel):
    thinking: str = Field(description="Summarize the current state and decide what to do next.")

toolkit.set_extended_model("my_search", ThinkingModel)
```

### Interrupting Tool Execution
Async tools can be interrupted via asyncio cancellation. The `Toolkit` handles this gracefully, returning an `is_interrupted=True` `ToolResponse`.

### Tool Groups (Automatic Tool Management)

Organize tools into named groups. Only tools in activated groups are visible to agents.

```python
toolkit.create_tool_group(
    group_name="browser_use",
    description="Web browsing tools.",
    active=False,
    notes="1. Use navigate to open pages. 2. ...",
)
toolkit.register_tool_function(navigate, group_name="browser_use")
toolkit.update_tool_groups(group_names=["browser_use"], active=True)

# Meta tool lets the agent manage its own tools
toolkit.register_tool_function(toolkit.reset_equipped_tools)
```

Enable in `ReActAgent` with `enable_meta_tool=True`.

---

## 10. MCP (Model Context Protocol)

AgentScope supports both HTTP (Streamable HTTP and SSE) and StdIO MCP servers.

### Client Types

| Client | Protocol |
|---|---|
| `HttpStatefulClient` | HTTP (maintains persistent session) |
| `HttpStatelessClient` | HTTP (new session per call) |
| `StdIOStatefulClient` | StdIO (starts local server on connect) |

```python
from agentscope.mcp import HttpStatefulClient, HttpStatelessClient

stateless = HttpStatelessClient(
    name="map_mcp",
    transport="streamable_http",
    url=f"https://mcp.amap.com/mcp?key={API_KEY}",
)
```

### Registering MCP Tools
```python
toolkit = Toolkit()
await toolkit.register_mcp_client(stateless_client)
# Optional: group_name="map_services"

# Remove tools
toolkit.remove_tool_function("maps_geo")
await toolkit.remove_mcp_clients(client_names=["map_mcp"])
```

### Function-Level MCP Access
```python
func_obj = await stateless_client.get_callable_function(
    func_name="maps_geo",
    wrap_tool_result=True,  # returns ToolResponse; False returns raw mcp result
)
res = await func_obj(address="Tiananmen Square", city="Beijing")
```

---

## 11. Agent Skill

Agent Skills are reusable, shareable skill packs that can be loaded by agents. Refer to the [Agent Skill](https://doc.agentscope.io/tutorial/task_agent_skill.html) section for detailed info.

---

## 12. Agent

### ReActAgent (Main Production Agent)

`ReActAgent` is the flagship implementation, integrating:

| Feature | Notes |
|---|---|
| Realtime steering (interrupt) | User can interrupt at any time |
| Memory compression | Automatic LLM-based compression when tokens exceed threshold |
| Parallel tool calls | Uses `asyncio.gather` |
| Structured output | Via Pydantic model in `__call__` |
| Fine-grained MCP control | Server/function level |
| Agent-controlled tools (Meta tool) | Agent can manage its own tool groups |
| Self-controlled long-term memory | `agent_control` / `static_control` / `both` |
| Automatic state management | Session/state persistence |

### Creating a ReActAgent
```python
from agentscope.agent import ReActAgent
from agentscope.formatter import DashScopeChatFormatter
from agentscope.memory import InMemoryMemory
from agentscope.model import DashScopeChatModel
from agentscope.tool import Toolkit

toolkit = Toolkit()
toolkit.register_tool_function(execute_python_code)

jarvis = ReActAgent(
    name="Jarvis",
    sys_prompt="You're a helpful assistant named Jarvis",
    model=DashScopeChatModel(model_name="qwen-max", api_key=..., stream=True),
    formatter=DashScopeChatFormatter(),
    toolkit=toolkit,
    memory=InMemoryMemory(),
    parallel_tool_calls=True,        # Enable parallel tool execution
    enable_meta_tool=True,           # Let agent manage its own tools
    max_iters=10,                    # Max ReAct iterations
)

msg = Msg(name="user", content="Run Hello World in Python.", role="user")
await jarvis(msg)
```

### ReActAgent Constructor Parameters

| Parameter | Description |
|---|---|
| `name` | Agent name |
| `sys_prompt` | System prompt |
| `model` | LLM model instance |
| `formatter` | Prompt formatter |
| `toolkit` | Tool management |
| `memory` | Short-term memory |
| `long_term_memory` | Long-term memory instance |
| `long_term_memory_mode` | `agent_control` / `static_control` / `both` |
| `enable_meta_tool` | Allow agent to self-manage tool groups |
| `parallel_tool_calls` | Enable parallel tool execution |
| `max_iters` | Max reasoning/acting iterations |
| `plan_notebook` | Plan management notebook |
| `compression_config` | Memory compression configuration |
| `knowledge` | RAG knowledge base (generic manner) |

### Memory Compression
```python
from agentscope.token import CharTokenCounter

agent = ReActAgent(
    ...
    compression_config=ReActAgent.CompressionConfig(
        enable=True,
        agent_token_counter=CharTokenCounter(),
        trigger_threshold=10000,
        keep_recent=3,
        # Optional custom compression
        summary_schema=CustomPydanticModel,
        compression_prompt="<system-hint>Summarize...</system-hint>",
        summary_template="Summary:\n{field1}\n{field2}",
        compression_model=smaller_model,   # Use cheaper model for compression
    ),
)
```

Default summary fields: `task_overview`, `current_state`, `important_discoveries`, `next_steps`, `context_to_preserve`.

### Realtime Steering (Interrupt)
```python
# In user code:
await agent.interrupt()   # Cancels current reply, calls handle_interrupt()
```

Override `handle_interrupt` in custom agents to customize post-interrupt behavior.

### Structured Output
```python
from pydantic import BaseModel, Field

class PersonModel(BaseModel):
    name: str = Field(description="Person's name")
    age: int = Field(description="Person's age")

res = await agent(Msg("user", "Introduce Einstein", "user"), structured_model=PersonModel)
print(res.metadata)  # {"name": "Albert Einstein", "age": 76, ...}
```

### Parallel Tool Calls
```python
agent = ReActAgent(
    ...
    parallel_tool_calls=True,
    model=DashScopeChatModel(..., generate_kwargs={"parallel_tool_calls": True}),
)
```

### Agent Base Classes

| Class | Abstract Methods | Hooks |
|---|---|---|
| `AgentBase` | `reply`, `observe`, `print`, `handle_interrupt` | pre/post_reply, pre/post_observe, pre/post_print |
| `ReActAgentBase` | + `_reasoning`, `_acting` | + pre/post_reasoning, pre/post_acting |
| `ReActAgent` | (full implementation) | all hooks |
| `UserAgent` | (human-in-the-loop) | — |
| `A2aAgent` | (remote A2A) | pre/post_reply, pre/post_observe, pre/post_print |

### Creating a Custom Agent
```python
class MyAgent(AgentBase):
    def __init__(self):
        super().__init__()
        self.name = "Friday"
        self.model = DashScopeChatModel(...)
        self.formatter = DashScopeChatFormatter()
        self.memory = InMemoryMemory()

    async def reply(self, msg: Msg | list[Msg] | None) -> Msg:
        await self.memory.add(msg)
        prompt = await self.formatter.format([
            Msg("system", self.sys_prompt, "system"),
            *await self.memory.get_memory(),
        ])
        response = await self.model(prompt)
        out = Msg(name=self.name, content=response.content, role="assistant")
        await self.memory.add(out)
        await self.print(out)
        return out

    async def observe(self, msg): await self.memory.add(msg)

    async def handle_interrupt(self):
        return Msg(self.name, "I noticed you interrupted me!", "assistant")
```

---

## 13. State / Session Management

AgentScope separates object initialization from state, enabling persistence across sessions:

```python
# Save state
state = agent.state_dict()

# Restore state
new_agent = ReActAgent(...)
new_agent.load_state_dict(state)
```

Nested state management links agent ↔ memory ↔ long-term memory ↔ toolkit states together.

---

## 14. Agent Hooks

Hooks allow you to inject custom code before/after agent lifecycle events:

Available hooks: `pre_reply`, `post_reply`, `pre_observe`, `post_observe`, `pre_print`, `post_print`, `pre_reasoning`, `post_reasoning`, `pre_acting`, `post_acting`.

Register via the agent's hook registration methods. See [Agent Hooks](https://doc.agentscope.io/tutorial/task_hook.html) for full reference.

---

## 15. Middleware

Middleware can wrap agent calls for cross-cutting concerns (logging, rate limiting, retries, etc.). See [Middleware](https://doc.agentscope.io/tutorial/task_middleware.html) for details.

---

## 16. A2A Agent

A2A (Agent-to-Agent) is an open standard protocol for interoperable communication between AI agents. AgentScope supports it at two levels:

### Key Classes

| Class | Description |
|---|---|
| `A2AAgent` | Communicates with remote A2A agents |
| `A2AChatFormatter` | Converts between AgentScope Msg and A2A protocol formats |
| `FileAgentCardResolver` | Loads Agent Cards from local JSON files |
| `WellKnownAgentCardResolver` | Fetches from well-known server path |
| `NacosAgentCardResolver` | Fetches from Nacos Agent Registry (v3.1.0+) |

### Usage
```python
from agentscope.agent import A2AAgent
from a2a.types import AgentCard, AgentCapabilities

agent_card = AgentCard(
    name="Friday",
    url="http://localhost:8000",
    version="1.0.0",
    capabilities=AgentCapabilities(streaming=True),
    ...
)

agent = A2AAgent(agent_card=agent_card)

# Use in chatbot
msg = await agent(Msg("user", "Hello!", "user"))
```

**Limitations:** Only supports chatbot (one user, one agent). No realtime interruption, no agentic structured output.

---

## 17. Realtime Agent

Realtime agents support streaming audio/video interactions. See [Realtime Agent](https://doc.agentscope.io/tutorial/task_realtime.html) for details.

---

## 18. Workflows

### Conversation
AgentScope supports two styles of conversation:

**User-Agent (Chatbot):** Use `DashScopeChatFormatter` or similar "Chat" formatters. The `role` field distinguishes user from agent.

```python
friday = ReActAgent(name="Friday", ..., formatter=DashScopeChatFormatter(), memory=InMemoryMemory())
user = UserAgent(name="User")

async def run():
    msg = None
    while True:
        msg = await friday(msg)
        msg = await user(msg)
        if msg.get_text_content() == "exit":
            break
```

**Multi-Agent Conversation:** Use `DashScopeMultiAgentFormatter` or similar "MultiAgent" formatters. History is combined into a single user message with `name` labels.

```python
async with MsgHub([alice, bob, charlie], announcement=Msg("system", "Introduce yourselves.", "system")):
    await alice()
    await bob()
    await charlie()
```

### Multi-Agent Debate
Multiple agents debate/discuss a topic. See [Multi-Agent Debate](https://doc.agentscope.io/tutorial/workflow_multiagent_debate.html).

### Concurrent Agents
Run agents in parallel. See [Concurrent Agents](https://doc.agentscope.io/tutorial/workflow_concurrent_agents.html).

### Routing
Route messages to specific agents based on conditions. See [Routing](https://doc.agentscope.io/tutorial/workflow_routing.html).

### Handoffs
Transfer control between agents. See [Handoffs](https://doc.agentscope.io/tutorial/workflow_handoffs.html).

---

## 19. Pipeline

The `agentscope.pipeline` module provides syntax sugar for multi-agent orchestration.

### MsgHub (Broadcast)
An async context manager. Any message generated by a participant is automatically broadcast (via `observe`) to all other participants.

```python
async with MsgHub(
    participants=[alice, bob, charlie],
    announcement=Msg("user", "Introduce yourself.", "user"),
) as hub:
    await alice()
    await bob()
    await charlie()

# Dynamic participant management
hub.add(david)
hub.delete(alice)
await hub.broadcast(Msg("system", "Begin!", "system"))
```

### Sequential Pipeline
Chains agents where output of one becomes input of the next.

```python
from agentscope.pipeline import sequential_pipeline

msg = await sequential_pipeline(agents=[alice, bob, charlie], msg=None)

# Class-based (reusable)
from agentscope.pipeline import SequentialPipeline
pipeline = SequentialPipeline(agents=[alice, bob, charlie])
msg = await pipeline(msg=None)
```

### Fanout Pipeline
Distributes same input to multiple agents and collects all responses.

```python
from agentscope.pipeline import fanout_pipeline

msgs = await fanout_pipeline(
    agents=[alice, bob, charlie],
    msg=Msg("user", "What do you think?", "user"),
    enable_gather=True,   # True = concurrent (default), False = sequential
)

# Class-based
from agentscope.pipeline import FanoutPipeline
pipeline = FanoutPipeline(agents=[alice, bob, charlie])
msgs = await pipeline(msg=None)
```

### Stream Printing Messages
Converts agent printing messages to an async generator for streaming UI updates.

```python
from agentscope.pipeline import stream_printing_messages

async for msg, last in stream_printing_messages(
    agents=[agent],
    coroutine_task=agent(Msg("user", "Hello!", "user")),
):
    print(msg, "| final:", last)
```

---

## 20. Plan

The Plan module provides `PlanNotebook` to help agents maintain structured plans during complex tasks. Set `plan_notebook` in `ReActAgent` to enable. See [Plan](https://doc.agentscope.io/tutorial/task_plan.html) for details.

---

## 21. RAG

### RAG Components

| Component | Description |
|---|---|
| **Reader** | Reads and chunks input documents into `Document` objects |
| **Knowledge** | Stores documents and retrieves relevant ones via embedding similarity |

### Built-in Readers

- `TextReader` — Text strings
- `PDFReader` — PDF files
- `ImageReader` — Images (supports multimodal embedding)
- `WordReader` — Word documents
- `ExcelReader` — Excel files
- `PowerPointReader` — PowerPoint files

### Document Object Fields
- `metadata`: content, doc_id, chunk_id, total_chunks
- `embedding`: embedding vector (filled on add/retrieve)
- `score`: relevance score (filled on retrieve)

### Building a Knowledge Base
```python
from agentscope.rag import TextReader, SimpleKnowledge, QdrantStore
from agentscope.embedding import DashScopeTextEmbedding

reader = TextReader(chunk_size=512, split_by="paragraph")
documents = await reader(text="John Doe is 28 years old...")

knowledge = SimpleKnowledge(
    embedding_model=DashScopeTextEmbedding(api_key=..., model_name="text-embedding-v4", dimensions=1024),
    embedding_store=QdrantStore(location=":memory:", collection_name="test", dimensions=1024),
)

await knowledge.add_documents(documents)

docs = await knowledge.retrieve(query="Who is John's father?", limit=3, score_threshold=0.5)
```

### Integration with ReActAgent

**Agentic Manner** (agent decides when to retrieve):
```python
toolkit.register_tool_function(
    knowledge.retrieve_knowledge,
    func_description="Use this to retrieve documents about John Doe.",
)
agent = ReActAgent(..., toolkit=toolkit)
```

**Generic Manner** (automatic retrieval on each reply):
```python
agent = ReActAgent(..., knowledge=knowledge)
```

### Multimodal RAG
```python
from agentscope.rag import ImageReader
from agentscope.embedding import DashScopeMultiModalEmbedding

reader = ImageReader()
docs = await reader(image_url="./example.jpg")

knowledge = SimpleKnowledge(
    embedding_model=DashScopeMultiModalEmbedding(api_key=..., model_name="multimodal-embedding-v1"),
    embedding_store=QdrantStore(location=":memory:", collection_name="test", dimensions=1024),
)
await knowledge.add_documents(docs)
# Use with a vision model like qwen-vl-max
```

### Custom RAG Components

| Base Class | Abstract Methods |
|---|---|
| `ReaderBase` | `__call__` |
| `VDBStoreBase` | `add`, `search`, `get_client` (opt), `delete` (opt) |
| `KnowledgeBase` | `retrieve`, `add_documents` |

---

## 22. AgentScope Studio

A local web application for developing and monitoring agent apps.

### Install & Start
```bash
npm install -g @agentscope/studio
as_studio
```

### Connect Your App
```python
import agentscope
agentscope.init(studio_url="http://localhost:3000")
```

### Features
- Project management dashboard
- Application visualization (token usage, model invocations, tracing)
- Native tracing visualization
- Built-in "Friday" agent for secondary development

### Friday Agent (Built-in)
An experimental local-deployed agent featuring: meta tool, agent hooks, interruption support, truncated prompt, state/session management. Long-term memory support is in progress (🚧).

---

## 23. Tracing

AgentScope uses **OpenTelemetry-based tracing**, compatible with any OTLP backend.

### Setup

```python
import agentscope

# AgentScope Studio
agentscope.init(studio_url="http://localhost:3000")

# Any OTLP backend
agentscope.init(tracing_url="https://your-tracing-backend:port/traces")
```

### Third-Party Platform Examples

**Langfuse:**
```python
import base64
auth = base64.b64encode(f"{PUBLIC_KEY}:{SECRET_KEY}".encode()).decode("ascii")
os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"Authorization=Basic {auth}"
agentscope.init(tracing_url="https://cloud.langfuse.com/api/public/otel/v1/traces")
```

**Arize Phoenix:**
```python
os.environ["OTEL_EXPORTER_OTLP_HEADERS"] = f"api_key={PHOENIX_API_KEY}"
agentscope.init(tracing_url="https://app.phoenix.arize.com/v1/traces")
```

**Alibaba Cloud CloudMonitor:**
```python
agentscope.init(tracing_url="https://tracing-cn-hangzhou.arms.aliyuncs.com/adapt_xxx/api/otlp/traces")
```

### Built-in Trace Decorators

| Decorator | Use Case |
|---|---|
| `@trace_llm` | Trace `__call__` on `ChatModelBase` subclasses |
| `@trace_reply` | Trace `reply` on `AgentBase` subclasses |
| `@trace_format` | Trace `format` on `FormatterBase` subclasses |
| `@trace(name='...')` | Trace any sync/async/generator function |

```python
from agentscope.tracing import trace

@trace(name='my_function')
async def my_function(data: dict) -> dict:
    return {"result": data}
```

---

## 24. Evaluation

AgentScope provides evaluation tools for measuring agent performance. Support for OpenJudge is also available. See [Evaluation](https://doc.agentscope.io/tutorial/task_eval.html) and [Evaluation with OpenJudge](https://doc.agentscope.io/tutorial/task_eval_openjudge.html).

---

## 25. Embedding

AgentScope provides embedding models for text and multimodal content:

| Class | Provider |
|---|---|
| `DashScopeTextEmbedding` | Alibaba DashScope |
| `DashScopeMultiModalEmbedding` | Alibaba DashScope (multimodal) |

See [Embedding](https://doc.agentscope.io/tutorial/task_embedding.html) for full reference.

---

## 26. TTS

Text-to-Speech integration is available. See [TTS](https://doc.agentscope.io/tutorial/task_tts.html) for details. Built-in tool functions include `dashscope_text_to_audio` and `openai_text_to_audio`.

---

## 27. Token

AgentScope provides token counting utilities for managing context windows.

- `CharTokenCounter` — Simple character-based counter (used in compression config)

See [Token](https://doc.agentscope.io/tutorial/task_token.html) for full reference.

---

## API Module Map

| Module | Contents |
|---|---|
| `agentscope` | Top-level init, version |
| `agentscope.message` | `Msg`, all Block types |
| `agentscope.model` | All model classes, `ChatResponse` |
| `agentscope.formatter` | All formatter classes |
| `agentscope.agent` | `ReActAgent`, `AgentBase`, `ReActAgentBase`, `UserAgent`, `A2AAgent` |
| `agentscope.memory` | `InMemoryMemory`, `AsyncSQLAlchemyMemory`, `RedisMemory` |
| `agentscope.tool` | `Toolkit`, `ToolResponse`, all built-in tools |
| `agentscope.mcp` | `HttpStatefulClient`, `HttpStatelessClient`, `StdIOStatefulClient` |
| `agentscope.pipeline` | `MsgHub`, `sequential_pipeline`, `fanout_pipeline`, `SequentialPipeline`, `FanoutPipeline`, `stream_printing_messages` |
| `agentscope.rag` | All Reader classes, `SimpleKnowledge`, `QdrantStore`, `Document` |
| `agentscope.embedding` | Embedding model classes |
| `agentscope.tracing` | Tracing decorators |
| `agentscope.token` | Token counter classes |
| `agentscope.plan` | `PlanNotebook` |
| `agentscope.evaluate` | Evaluation utilities |
| `agentscope.session` | Session management |
| `agentscope.tts` | TTS utilities |
| `agentscope.exception` | Custom exceptions |

---

*Document compiled from https://doc.agentscope.io/ — AgentScope v1.0 (Alibaba)*
