Jamf Pro Usage Report は、Jamf Pro のオブジェクト使用状況をスプレッドシートに書き出して確認するためのツールです。

Smart Computer Group には "Reports" という機能がありますが、その他のオブジェクトではこれが利用できないため作成しました。

## Sheets

### Objects

以下のオブジェクトの一覧です。

- category
- computer_group
- policy
- configuration_profile
- package
- script
- advanced_computer_search
- computer_prestage

### Report

各オブジェクトがどこで使用されているかの状態を表したレポートです。

## 設定

### 前提条件

- Google Apps Script API の有効化が完了していること
- clasp のパッケージインストール、Googleアカウントの認証が完了していること

### APIロールとクライアントの作成

Jamf Pro で以下の権限を含んだAPIロールを作成し、そのロールを割り当てたAPIクライアントを作成します。

[必要な権限]

- Read macOS Configuration Profiles
- Read Advanced Computer Searches
- Read Smart Computer Groups
- Read Categories
- Read Packages
- Read Computer Extension Attributes
- Read Static Computer Groups
- Read Policies
- Read Scripts
- Read Computer PreStage Enrollments

### Google Apps Script の作成

- 新規でスプレッドシートを作成して Apps Script プロジェクトを作成します
- Apps Script プロジェクトのスクリプトIDをコピーします
- .clasp.json.sample をコピーして .clasp.json を作成します
- .clasp.json を編集して `scriptId` の値にコピーしたスクリプトIDを指定します
- `clasp push` でスクリプトをデプロイします

### プロパティの設定

- Apps Script プロジェクトの設定画面を開きます
- スクリプトプロパティを編集 をクリックします
- 以下のプロパティを追加します
  - `SERVER`: e.g. mycompany.jamfcloud.com
  - `AUTH_METHDO`: oauth2 or basic (未設定の場合は oauth2)
  - `CLIENT_ID`: 作成したAPIクライアントのクライアントID (AUTH_METHOD: oauth2)
  - `CLIENT_SECRET`: 作成したAPIクライアントのクライアントシークレット  (AUTH_METHOD: oauth2)
  - `USERNAME`: Basic認証を行う Jamf Pro ユーザー名 (AUTH_METHOD: basic)
  - `PASSWORD`: Basic認証を行う Jamf Pro ユーザーのパスワード (AUTH_METHOD: basic)

## レポートの作成

- スプレッドシートを開きます
  - 既に開いている場合はリロードしてください
- `Jamf Pro` というメニューが追加されます
- いずれかのメニューを選択して実行するとレポートが作成されます
  - `Update Objects`: オブジェクト一覧を作成します
  - `Update Report`: 利用状況のレポートを作成します
  - 初回実行時のみGoogleアカウントの許可が必要です
