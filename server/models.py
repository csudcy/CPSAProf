from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column
from sqlalchemy.types import String, Integer

Base = declarative_base()

class LogMessage(Base):
    __tablename__ = 'logs'

    id = Column(Integer, primary_key=True)
    value = Column(String)
