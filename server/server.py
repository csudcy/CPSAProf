import logging
import os

import cherrypy
from cp_sqlalchemy import SQLAlchemyTool, SQLAlchemyPlugin

from . import models
from .saprofile.cpsa import CPSA

HERE = os.path.dirname(os.path.abspath(__file__))


class Root(object):

    def page(self):
        return '''
        <html>
          <head><title>CherryPy-SQLAlchemy Example</title></head>
          <body>
            <form action='/' method='post'>
              <input type='text' name='message' /><input type='submit' value='add' />
            </form>
            %s
          </body>
        <html>
        '''

    @cherrypy.expose
    def index(self, message=None, submit=None):
        # Add a new message
        if message:
            cherrypy.request.db.add(models.LogMessage(value=message))
            cherrypy.request.db.commit()
            raise cherrypy.HTTPRedirect('/')

        # Hack some HTML together
        page = self.page()
        ol = ['<ol>']
        print cherrypy.request.db.query(models.LogMessage).count()
        for msg in cherrypy.request.db.query(models.LogMessage).all():
            ol.append('<li>%s</li>' % msg.value)
        ol.append('</ol>')

        return page % ('\n'.join(ol))


def run():
    setup_logging()
    init_db()
    run_server()


def setup_logging():
    logging.basicConfig()
    logging.getLogger('server.saprofile').setLevel(logging.DEBUG)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)


def init_db():
    cherrypy.tools.db = SQLAlchemyTool()
    dbfile = os.path.join(HERE, 'log.db')
    if not os.path.exists(dbfile):
        open(dbfile, 'w+').close()
    sqlalchemy_plugin = SQLAlchemyPlugin(
        cherrypy.engine,
        models.Base,
        'sqlite:///%s' % (dbfile),
        echo=True
    )
    sqlalchemy_plugin.subscribe()
    sqlalchemy_plugin.create()


def run_server():
    cherrypy.config.update({
        'server.socket_host': os.environ.get('IP', '0.0.0.0'),
        'server.socket_port': int(os.environ.get('PORT', '8080')),
    })
    cherrypy.tree.mount(
        Root(),
        '/',
        config={
            '/': {
                'tools.db.on': True,
            }
        }
    )
    cherrypy.tree.mount(
        CPSA(),
        '/cpsa/'
    )
    cherrypy.engine.start()
    cherrypy.engine.block()
