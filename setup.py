from setuptools import find_packages, setup


print find_packages()

setup(
    name='CPSAProf',
    version='0.0.1',
    url='https://github.com/csudcy/CPSAProf',
    author='Nicholas Lee',
    author_email='csudcy@gmail.com',
    description='A live profiling tool for cherrypy & sqlalchemy',
    license='MIT',
    packages=find_packages(),
    include_package_data=True,
    zip_safe=False,
    classifiers=[
        'Development Status :: 2 - Pre-Alpha',
        'Environment :: Web Environment',
        'Framework :: CherryPy',
        'Framework :: SQLAlchemy',
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License',
        'Operating System :: OS Independent',
        'Programming Language :: Python',
        'Programming Language :: Python :: 2',
        'Programming Language :: Python :: 2.7',
        'Topic :: Internet :: WWW/HTTP',
        'Topic :: Software Development :: Libraries :: Python Modules',
    ],
)
