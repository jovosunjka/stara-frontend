import { BlockElement } from './block-element';

export interface DataStore extends BlockElement {
    dataIsEncrypted: boolean;
    dataIsSigned: boolean;
    storeCredentials: boolean;
    hasBackup: boolean;
}
