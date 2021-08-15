import type * as IBrowserFS from "browserfs";
import type HTTPRequest from "browserfs/dist/node/backend/HTTPRequest";
import type IndexedDBFileSystem from "browserfs/dist/node/backend/IndexedDB";
import type IsoFS from "browserfs/dist/node/backend/IsoFS";
import type MountableFileSystem from "browserfs/dist/node/backend/MountableFileSystem";
import type OverlayFS from "browserfs/dist/node/backend/OverlayFS";
import type ZipFS from "browserfs/dist/node/backend/ZipFS";
import type { BFSCallback } from "browserfs/dist/node/core/file_system";
import type { FSModule } from "browserfs/dist/node/core/FS";
import { handleFileInputEvent } from "components/system/Files/FileManager/functions";
import FileSystemConfig from "contexts/fileSystem/FileSystemConfig";
import { extname } from "path";
import * as BrowserFS from "public/libs/browserfs/browserfs.min.js";
import type React from "react";
import { useEffect, useState } from "react";
import { EMPTY_BUFFER } from "utils/constants";

export type FileSystemContextState = {
  fs?: FSModule;
  mountFs: (url: string, callback: () => void) => void;
  setFileInput: React.Dispatch<
    React.SetStateAction<HTMLInputElement | undefined>
  >;
  unMountFs: (url: string) => void;
  addFile: (callback: (name: string, buffer?: Buffer) => void) => void;
  resetFs: () => Promise<void>;
};

const { BFSRequire, configure, FileSystem } = BrowserFS as typeof IBrowserFS;

const useFileSystemContextState = (): FileSystemContextState => {
  const [fs, setFs] = useState<FSModule>();
  const [fileInput, setFileInput] = useState<HTMLInputElement>();
  const rootFs = fs?.getRootFS() as MountableFileSystem;
  const mountFs = (url: string, callback: () => void): void =>
    fs?.readFile(url, (_readError, fileData = EMPTY_BUFFER) => {
      const isISO = extname(url) === ".iso";
      const createFs: BFSCallback<IsoFS | ZipFS> = (_createError, newFs) => {
        if (newFs) {
          rootFs?.mount(url, newFs);
          callback();
        }
      };

      if (isISO) {
        FileSystem.IsoFS.Create({ data: fileData }, createFs);
      } else {
        FileSystem.ZipFS.Create({ zipData: fileData }, createFs);
      }
    });
  const unMountFs = (url: string): void => rootFs?.umount(url);
  const addFile = (callback: (name: string, buffer?: Buffer) => void): void => {
    if (fileInput) {
      fileInput.addEventListener(
        "change",
        (event) => handleFileInputEvent(event, callback),
        { once: true }
      );
      fileInput.click();
    }
  };
  const resetFs = (): Promise<void> =>
    new Promise((resolve, reject) => {
      // eslint-disable-next-line no-underscore-dangle
      const overlayFs = rootFs._getFs("/").fs as OverlayFS;
      const overlayedFileSystems = overlayFs.getOverlayedFileSystems();
      const readable = overlayedFileSystems.readable as HTTPRequest;
      const writable = overlayedFileSystems.writable as IndexedDBFileSystem;

      readable.empty();
      writable.empty((apiError) => (apiError ? reject(apiError) : resolve()));
    });
  useEffect(() => {
    if (!fs) {
      configure(FileSystemConfig, () => setFs(BFSRequire("fs")));
    }
  }, [fs]);

  return { fs, mountFs, setFileInput, unMountFs, addFile, resetFs };
};

export default useFileSystemContextState;
