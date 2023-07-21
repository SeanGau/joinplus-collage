# about
* [Fork from Seedingfuture](https://github.com/SeanGau/seedingfuture)
* [joinplus 計畫共筆](g0v.hackmd.io/@chewei/joinplus/)
* [素材取自 unlimitedcities](https://github.com/Monaludao/unlimitedcities)
* 授權：GNU GPL V3

# 檔案結構
* 程式使用python3 flask做框架
* 來源圖片放置於 static/source
* 背景圖片放置於 static/source/bg
* 程式於執行時會自動產生thumb縮圖

# 來源分類
* 修改 static/source/category.json 即可

# how to run
1. 設置好 DATABASE 環境變數和 config.py
2.
```bash
pipenv sync
pipenv run flask run
```
