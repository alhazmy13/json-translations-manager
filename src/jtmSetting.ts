

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

export function getSettings() {
    let configuration;
    try {
      const rawdata = fs.readFileSync(
        path.join(
          vscode.workspace.rootPath!,
          "json-translations-manager-settings.json"
        )
      );
      if (rawdata) {
        configuration = JSON.parse(rawdata.toString());
      }
    } catch {}
  
    if (!configuration) {
      vscode.window
        .showOpenDialog({
          canSelectMany: false,
          canSelectFiles: false,
          canSelectFolders: true,
        })
        .then((fileUri) => {
          if (fileUri && fileUri[0]) {
            const folderpath = fileUri[0].fsPath.replace(
              vscode.workspace.rootPath!,
              ""
            );
            console.log("Selected folder: " + folderpath);
            const data = {
              translationFolder: folderpath,
            };
            fs.appendFile(
              path.join(
                vscode.workspace.rootPath!,
                "json-translations-manager-settings.json"
              ),
              JSON.stringify(data, null, 2),
              function (err) {
                if (err) {
                  throw err;
                }
                console.log("Settings Saved!");
                vscode.window.showInformationMessage(
                  "translation Folder Settings Saved in " +
                    path.join(
                      vscode.workspace.rootPath!,
                      "json-translations-manager-settings.json"
                    )
                );
              }
            );
          }
        });
    } else {
      return configuration;
    }
    return configuration;
  }