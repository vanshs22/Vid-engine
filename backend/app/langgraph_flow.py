from __future__ import annotations

from typing import Any, Callable


def build_langgraph(nodes: dict[str, Callable[[dict[str, Any]], dict[str, Any]]]):
    """Build a checkpointable graph when LangGraph is installed.

    The local CLI can use the Director fallback when optional dependencies are
    unavailable. Production deployments should install backend/pyproject.toml.
    """
    try:
        from langgraph.graph import END, START, StateGraph
    except ImportError:
        return None
    graph = StateGraph(dict)
    ordered = list(nodes)
    for name, handler in nodes.items():
        graph.add_node(name, handler)
    if ordered:
        graph.add_edge(START, ordered[0])
        for left, right in zip(ordered, ordered[1:]):
            graph.add_edge(left, right)
        graph.add_edge(ordered[-1], END)
    return graph.compile()
