from app.database.session import engine
from app.database import models  # import models from the database package

def init_db():
    print("Tables registered:", models.Base.metadata.tables.keys())
    models.Base.metadata.create_all(bind=engine)
