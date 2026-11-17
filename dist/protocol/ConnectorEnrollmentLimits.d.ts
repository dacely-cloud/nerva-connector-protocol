/** Initial bounded enrollment policy; history is never silently expired, reused or deleted to regain quota. */
export declare class ConnectorEnrollmentLimits {
    /** Maximum retained invitation records per account, including consumed, expired and revoked history. */
    static readonly maximumEnrollments: number;
    /** Bootstrap authorization lasts ten minutes according to the database clock. */
    static readonly lifetimeMs: number;
}
