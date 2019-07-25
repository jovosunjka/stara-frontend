export interface ImportAsset {
    assetId: string;
    assetTitle: string;
    protectConfidentiality?: boolean;
    protectIntegrity?: boolean;
    protectAvailability?: boolean;
    impactConfidentiality?: number;
    impactIntegrity?: number;
    impactAvailability?: number;
}
