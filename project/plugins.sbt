// The Play plugin
resolvers += "Typesafe repository" at "http://repo.typesafe.com/typesafe/releases/"
resolvers += "scalaz-bintray" at "http://dl.bintray.com/scalaz/releases"


addSbtPlugin("com.typesafe.play" % "sbt-plugin" % "2.6.13")

addSbtPlugin("org.bjason" % "crud4playplugin" % "0.4" )

addSbtPlugin("com.heroku" % "sbt-heroku" % "2.0.0")
