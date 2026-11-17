import { type ConnectorInstructionsView, type ConnectorInstructionsUpdate } from './ConnectorInstructions.js';
/** Account guidance is validated independently of customer-reported device inventory. */
export declare class ConnectorInstructionsCodec {
    /** Preserve user formatting; reject malformed Unicode and controls that cannot be safely displayed. */
    static text(raw: unknown): string;
    /** Wire revisions are canonical decimal strings, never floating-point quantities. */
    static view(raw: unknown): ConnectorInstructionsView;
    /** A missing observed revision cannot become an unconditional overwrite. */
    static update(raw: unknown): ConnectorInstructionsUpdate;
}
