/** Fixed arguments remain local; callers supply only the explicitly variable positions. */
export declare enum ExecutionArgumentKind {
    Literal = "literal",
    Choice = "choice",
    Text = "text",
    RelativePath = "relative-path",
    MachineInvocation = "machine-invocation",
    InteractiveInvocation = "interactive-invocation"
}
