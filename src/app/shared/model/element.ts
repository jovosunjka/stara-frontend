import { Base } from './base';
import { ImportAsset } from './import-asset';
import { ImportExploit } from './import-exploit';

export interface Element extends Base {
    outOfScope: boolean;
    outOfScopeReason: string;
    exploits?: string[];
    importAssets?: ImportAsset[];
    importExploits?: ImportExploit[];
}
