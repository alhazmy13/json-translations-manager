import { WebViewManager } from './WebViewManager';
import * as vscode from 'vscode';
import { ConfigurationManager } from './ConfigurationManager';
import { TranslationManager } from './TranslationManager';
import { TreeDataProvider } from './TreeDataProvider';

const namespace = 'json-translations-manager';
export class CommandManager {
  private webViewManager!: WebViewManager;
  private translationManager!: TranslationManager;

  private treeDataProvider!: TreeDataProvider;
  constructor(
    _context: vscode.ExtensionContext,
    configurationManager: ConfigurationManager
  ) {
    this.init(_context, configurationManager);
  }

  init(
    _context: vscode.ExtensionContext,
    configurationManager: ConfigurationManager
  ) {
    this.translationManager = new TranslationManager(
      _context.extensionPath,
      configurationManager
    );
    this.webViewManager = new WebViewManager(_context, this.translationManager);
    this.treeDataProvider = new TreeDataProvider(this.translationManager);
    vscode.window.createTreeView(namespace, {
      treeDataProvider: this.treeDataProvider,
    });
    this.treeDataProvider.onRefresh.clear();
    this.treeDataProvider.onRefresh.subscribe(() =>
      this.init(_context, configurationManager)
    );
  }
  Translate = async () => {
    await this.checkConfigration();
    const key = await vscode.window.showInputBox({
      prompt: 'Enter Translation key',
      placeHolder: 'Use dot (.) notation to make the key a Nested objects',
    });

    await this.webViewManager.showTreanslationPanel(key!);
  };

  TranslateSelected = async () => {
    await this.checkConfigration();
    await this.webViewManager.showTreanslationPanel(this.getSelectedText());
  };

  TranslateTreeSelectedValue = async (value: any) => {
    await this.checkConfigration();
    await this.webViewManager.showTreanslationPanel(value, true);
  };

  private getSelectedText(): string {
    const editor = vscode.window.activeTextEditor;
    let selectedText = '';
    if (editor) {
      selectedText = editor.document.getText(editor.selection);
    }
    return selectedText;
  }

  private async checkConfigration() {
    if (
      !this.webViewManager.translationManager.configurationManager.configuration
    ) {
      await this.askUserToSelectTranslationPath(
        this.webViewManager.context,
        this.webViewManager.translationManager.configurationManager
      );
    }
  }

  public RegisterCommands(
    _context: vscode.ExtensionContext,
    configurationManager: ConfigurationManager
  ) {
    _context.subscriptions.push(
      vscode.commands.registerCommand(`${namespace}.translate`, this.Translate)
    );
    _context.subscriptions.push(
      vscode.commands.registerCommand(`${namespace}.config`, async () => {
        await this.askUserToSelectTranslationPath(
          _context,
          configurationManager
        );
      })
    );

    _context.subscriptions.push(
      vscode.commands.registerCommand(
        `${namespace}.translateSelected`,
        this.TranslateSelected
      )
    );

    _context.subscriptions.push(
      vscode.commands.registerCommand(
        `${namespace}.translateTreeSelectedValue`,
        this.TranslateTreeSelectedValue
      )
    );

    _context.subscriptions.push(
      vscode.commands.registerCommand(`${namespace}.refreshEntry`, () =>
        this.treeDataProvider.refresh()
      )
    );

    _context.subscriptions.push(
      vscode.commands.registerCommand(`${namespace}.addEntry`, () =>
        this.treeDataProvider.add()
      )
    );

    _context.subscriptions.push(
      vscode.commands.registerCommand(`${namespace}.deleteEntry`, (value) =>
        this.treeDataProvider.delete(value)
      )
    );

    _context.subscriptions.push(
      vscode.commands.registerCommand(`${namespace}.editEntry`, (value) => {
        this.treeDataProvider.rename(value);
      })
    );
  }

  public async askUserToSelectTranslationPath(
    _context: vscode.ExtensionContext,
    configurationManager: ConfigurationManager
  ) {
    const fileUri = await vscode.window.showOpenDialog({
      defaultUri: vscode.workspace.workspaceFolders![0].uri,
      canSelectMany: false,
      canSelectFiles: false,
      canSelectFolders: true,
    });

    if (fileUri && fileUri[0]) {
      const folderpath = fileUri[0].fsPath.replace(
        vscode.workspace.workspaceFolders![0].uri.fsPath,
        ''
      );
      await this.askUserToEnableSort(
        _context,
        configurationManager,
        folderpath
      );
    }
  }
  public async askUserToEnableSort(
    _context: vscode.ExtensionContext,
    configurationManager: ConfigurationManager,
    folderpath: string
  ) {
    const sort = {
      enable: 'Yes enable Translation Sorting',
      disable: 'No disable Translation Sorting',
    };
    const selection = await vscode.window.showQuickPick(
      [sort.enable, sort.disable],
      {
        canPickMany: false,
        placeHolder: 'Do you want to Sort translation keys alphabetically?',
      }
    );

    if (selection === sort.enable) {
      configurationManager.set({
        translationFolder: folderpath,
        sort: true,
      });
    } else if (selection === sort.disable) {
      configurationManager.set({
        translationFolder: folderpath,
        sort: false,
      });
    }
    vscode.commands.executeCommand(
      'setContext',
      `${namespace}:noConfig`,
      false
    );
    this.init(_context, configurationManager);
    //  this.RegisterCommands(_context, configurationManager);
    vscode.window.showInformationMessage(
      'Translation folder configuration Saved successfully'
    );
  }
}
