from flask_jwt_extended import JWTManager

class DB:
    def __init__(self,app):
        this._app = app
        this._uri = 'postgresql://username:password@localhost/db_name'
        this._db = null
        @a
    def db(__self__):
        this._app

        ['SQLALCHEMY_DATABASE_URI'] = 'postgresql://username:password@localhost/db_name'

app.config['SQLALCHEMY_DATABASE_URI'] = 
db = SQLAlchemy(app)
