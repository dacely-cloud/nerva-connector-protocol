import type { ConnectorHostTool } from './ConnectorHost.js';
import { type ConnectorHostArgumentBounds } from './ConnectorHostArgumentContract.js';
/**
 * A compact one-line notation for argument contracts, sized for a model's tool description and for error messages.
 *
 * @remarks
 * See {@link ConnectorHostArgumentShape.legend}. A plain field name is text; only fields of another kind carry a
 * suffix. Bounds are left out to keep a whole catalog small enough for every prompt; the validator's rejection
 * message states the exact bounds of the field it refuses. Mode groups render their alternatives joined by ` or `
 * in place of their fields.
 */
export declare class ConnectorHostArgumentShape {
    #private;
    /** How to read the notation; a plain field name is text, `[text]` a string list and `{text}` a string map. */
    static readonly legend: string;
    /** One tool's arguments, such as `{path,offset?:"n",maximumBytes?:n}`. */
    static of(tool: ConnectorHostTool, bounds: ConnectorHostArgumentBounds): string;
    /**
     * Every listed tool's arguments, tools with identical arguments grouped, as `a,b {…}; c {…}`.
     *
     * @remarks
     * A tool whose arguments extend an earlier tool's with further fields is written `{...earlier,further}`, so a
     * terminal launch does not repeat the program launch fields.
     */
    static catalog(tools: readonly ConnectorHostTool[], bounds: ConnectorHostArgumentBounds): string;
}
