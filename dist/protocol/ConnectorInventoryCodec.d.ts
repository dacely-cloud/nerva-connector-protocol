import type { ConnectorHostInventoryView } from './ConnectorInventory.js';
import { type ConnectorInventoryPublication, type ConnectorInventoryQuery, type ConnectorInventoryView, type ConnectorInventoryPage } from './ConnectorInventory.js';
/** Structured metadata is validated before signature work, storage or browser presentation. */
export declare class ConnectorInventoryCodec {
    /** A publication has no account override or caller-controlled online state. */
    static publication(raw: unknown): ConnectorInventoryPublication;
    /** The exact receiver, current confirmed lease and normalized complete metadata are signed. */
    static payload(value: Omit<ConnectorInventoryPublication, 'signature'>): string;
    /** An opaque ordered enrollment cursor cannot select another account. */
    static query(raw: unknown): ConnectorInventoryQuery;
    /** Public status is finite and distinct from installed or permitted tooling. */
    static view(raw: unknown): ConnectorInventoryView;
    /** Local host consent is finite customer-device metadata and never carries its private task directory. */
    static host(raw: unknown): ConnectorHostInventoryView;
    /** Response pages contain at most three distinct ordered identities. */
    static page(raw: unknown): ConnectorInventoryPage;
}
