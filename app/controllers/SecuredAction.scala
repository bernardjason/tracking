package controllers

import javax.inject.{Inject, Singleton}
import org.bjason.tracking.project.tables.ProjectModel
import org.bjason.tracking.user.tables.UserModel
import play.api.Logger
import play.api.cache._
import play.api.libs.json.JsObject
import play.api.mvc.{Request, _}
import play.mvc.Http.Status

import scala.concurrent.{ExecutionContext, Future}


@Singleton
class SecuredCrudResource @Inject()(cache: SyncCacheApi, val playBodyParsers: PlayBodyParsers)(implicit val executionContext: ExecutionContext)
  extends org.bjason.tracking.recordwork.controllers.CrudActionTrait
  with org.bjason.tracking.project.controllers.CrudActionTrait
     {

  override def invokeBlock[A](request: Request[A], block: (Request[A]) => Future[Result]) = {

    request.session.get("user").map { u =>

      val user = cache.get(u).asInstanceOf[Option[UserModel]]

      if (user.isEmpty) {
        Logger.info(s"not logged in, action ${request.method} ${request.uri}")

        Future.successful(Results.Status(Status.UNAUTHORIZED))
      } else {
        Logger.info(s"Calling action ${request.method} ${request.uri}")

        block(request)
      }
    }.getOrElse {
      Logger.info(s"not logged on, action ${request.method} ${request.uri}")

      Future.successful(Results.Status(Status.UNAUTHORIZED))
    }
  }
}

@Singleton
class SecuredCrudUser @Inject()(val playBodyParsers: PlayBodyParsers)(implicit val executionContext: ExecutionContext)
  extends org.bjason.tracking.project.controllers.CrudActionTrait
  with org.bjason.tracking.user.controllers.CrudActionTrait {

  override def invokeBlock[A](request: Request[A], block: (Request[A]) => Future[Result]) = {
    Logger.warn("Internal API not for external consumption")
    Future.successful(Results.Status(Status.UNAUTHORIZED))
    //block(request)
  }
}
