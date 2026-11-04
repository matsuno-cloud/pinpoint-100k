# Road to 100K（ピンポイント団 10万人到達予測）

YouTubeの登録者数を毎朝6時ごろに自動で記録し、直近のペースから10万人の到達日を予測するページです。Notionに埋め込んで使います。

## 仕組み
- GitHub Actions が毎朝 YouTube Data API で登録者数を取得 → `data/history.json` に追記
- `index.html` が履歴を読み、直近7/14/28/56日のペースから到達日を計算
  - 標準＝直近28日のペース、楽観＝一番速いペース、慎重＝一番遅いペース
- 本番日は `data/config.json` の `liveDate` を書き換えると反映されます

## 注意
- YouTube API の登録者数は上3桁に丸められています（例：93,600）。日々の値は粗いですが、数週間分の傾きで予測するので大きくはぶれません。
- 過去の推移は API では取れないため、YouTube Studio の CSV を `scripts/import-studio-csv.mjs` で取り込みます。
