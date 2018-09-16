# tracking
this is a demo application that I wrote while working on crud4play plugin. The plugin was used to generate all the CRUD rest resources needed for the application. The project was an end goal to help with crud4playplugin development 

Just needs in the plugins.sbt to use
```
resolvers += "scalaz-bintray" at "http://dl.bintray.com/scalaz/releases"
addSbtPlugin("org.bjason" % "crud4playplugin" % "0.4" )
```
https://bintray.com/bernardcjason/org.bjason/crud4playplugin/0.4

this project was developed against sqlite but I have run it against progres database as well. This has been deployed on Heroku

https://bjason-tracking.herokuapp.com

There are 2 users configured, **bernard** with a password of **jason**  and **tea** with a password of **mug**

The postgres ddl is in file 
[postgres.sql](postgres.sql)

To run the project locally
```
sbt run
```
The resources have some security around them, provided by 

[app/controllers/SecuredAction.scala](app/controllers/SecuredAction.scala)
[app/controllers/Module.scala](app/controllers/Module.scala)

that uses play cache to implement a simple login process. While I do some data validation for XSS in

[app/controllers/ScriptInjectCheck.scala](app/controllers/ScriptInjectCheck.scala)

which is added to crud config file 
	**object_mapper = "extends controllers.ScriptInjectCheck"**

see [conf/crud/Project.conf](conf/crud/Project.conf)

There are other examples of using the plugin in
[https://github.com/bernardjason/crud4playplugin/tree/master/src/sbt-test/crudplugin](https://github.com/bernardjason/crud4playplugin/tree/master/src/sbt-test/crudplugin)
