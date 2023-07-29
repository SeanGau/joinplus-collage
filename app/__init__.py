import flask
import os, shutil, json, hashlib, yaml, sqlite3, locale
from datetime import datetime
from PIL import Image

app = flask.Flask(__name__)
app.config.from_pyfile('config.py', silent=True)
app.jinja_env.globals['GLOBAL_TITLE'] = "Joinplus"
app.jinja_env.globals['GLOBAL_VERSION'] = datetime.now().timestamp()

locale.setlocale(locale.LC_ALL, 'zh_TW.UTF-8')
print('sqlite:', sqlite3.sqlite_version)
print('regenerating thumbnails....')
for (dirpath, dirnames, filenames) in os.walk("./app/static/source/bg"):
    for filename in filenames:
        #read the image      
        im = Image.open("./app/static/source/bg/"+filename)
        im.thumbnail((1000,500))
        nim = im.crop((250,0,750,500))
        nim.save("./app/static/source/bg/thumb/"+filename)
    break

for (dirpath, dirnames, filenames) in os.walk("./app/static/source"):
    for filename in filenames:
        if '.yml' in filename:
            continue
        #read the image
        im = Image.open("./app/static/source/"+filename)
        im.thumbnail((150,150))
        im.save("./app/static/source/thumb/"+filename)
    break
    
def get_db():
  db = getattr(flask.g, '_database', None)
  if db is None:
    db = flask.g._database = sqlite3.connect(app.config['DATABASE'])
    def make_dicts(cursor, row):
      return dict((cursor.description[idx][0], value) for idx, value in enumerate(row))
    db.row_factory = make_dicts
  return db
  
def init_db():
  with app.app_context():
    db = get_db()
    with app.open_resource('schema.sql', mode='r') as f:
      db.cursor().executescript(f.read())
    db.commit()
    
@app.route('/')
def index():    
    source_img = []
    bg_img = []
    for (dirpath, dirnames, filenames) in os.walk("./app/static/source/bg"):
        for filename in filenames:
            #read the image
            if not os.path.exists("./app/static/source/bg/thumb/"+filename):            
                im = Image.open("./app/static/source/bg/"+filename)
                im.thumbnail((1000,500))
                nim = im.crop((250,0,750,500))
                nim.save("./app/static/source/bg/thumb/"+filename)

            _dict = {
                "filename": filename,
                "hashed": hashlib.sha1(filename.encode()).hexdigest() 
            }
            bg_img.append(_dict)
        break
    for (dirpath, dirnames, filenames) in os.walk("./app/static/source"):
        for filename in filenames:
            if '.yml' in filename:
                continue
            #read the image
            if not os.path.exists("./app/static/source/thumb/"+filename):
                im = Image.open("./app/static/source/"+filename)
                im.thumbnail((150,150))
                im.save("./app/static/source/thumb/"+filename)
                #        _dict = {                "filename": filename,                "hashed": hashlib.sha1(filename.encode()).hexdigest()             }
            source_img.append(filename)
        break
    
    _category_data = {}
    with open("./app/static/source/_category.yml") as yml_file:
        _category_data = yaml.safe_load(yml_file)
    print(_category_data)
    for category in _category_data:
        for index in range(len(_category_data[category])):
            img = _category_data[category][index]
            if "." not in img:
                img+=".png"
                _category_data[category][index] = img
            print(img)
            source_img.remove(img)
    _category_data['未分類 Uncategorized'] = source_img
    print(_category_data)
    return flask.render_template('index.html', bgs = bg_img, categories = _category_data)

@app.route('/function/submit', methods = ['POST'])
def submit():
    if flask.request.method == 'POST':
        _data_dict = flask.request.get_json()
        print("get data", _data_dict)
        if len(_data_dict['collage']) < 1:
            return "Empty data"

        _data = json.dumps(_data_dict, ensure_ascii=False)
        _sql = f"INSERT INTO collage_datas (data) VALUES (\'{_data}\');"
        con = get_db()
        cur = con.cursor()
        cur.execute(_sql)
        con.commit()
        return "done" 

@app.route('/works')
def works():
        db = get_db()
        cb = db.execute(f"SELECT * FROM collage_datas;").fetchall()
        works_data = []
        for row in cb:
            _temp = row
            _temp['data'] = json.loads(row['data'])
            works_data.append(_temp)
        print(works_data)
        return flask.render_template('works.html', works_data = works_data)


@app.route('/loadfile', methods = ['GET', 'POST'])
def loadfile():
    if flask.request.method == 'POST':
        _data = flask.request.form
        print(_data)
    else:
        return flask.render_template('loadfile.html')
    
@app.route('/initdb')
def cleardb():
  if app.debug:
    print('init db')
    init_db()
    return flask.redirect('/')
  else:
    return flask.abort(403)