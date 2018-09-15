package controllers

import java.sql.Timestamp

import javax.inject._
import org.bjason.tracking.user.tables.{UserModel, UserTableOperation}
import org.bjason.tracking.project.tables.{ProjectModel, ProjectTableOperation}
import org.bjason.tracking.recordwork.tables.RecordWorkModel
import play.api.Logger
import play.api.cache.SyncCacheApi
import play.api.data.Forms._
import play.api.data.format.Formats._
import play.api.data.validation._
import play.api.data.{Form, Mapping}
import play.api.libs.json._
import play.api.mvc._

import scala.concurrent.ExecutionContext

class Application @Inject()(user: UserTableOperation, cc: MessagesControllerComponents
                           )(implicit ec: ExecutionContext, cache: SyncCacheApi)
  extends MessagesAbstractController(cc) {

  val timestamp: Mapping[Timestamp] = of[Timestamp]

  def nonEmptyTimeStamp: Constraint[Timestamp] = nonEmpty()

  def nonEmpty(errorMessage: String = "error.required"): Constraint[Timestamp] = Constraint[Timestamp]("constraint.required") { o =>
    if (o == null) Invalid(ValidationError(errorMessage)) else Valid
  }

  val userForm: Form[UserModel] = Form {
    mapping(
      "user_id" -> default(longNumber, -1L),
      "user_name" -> nonEmptyText,
      "user_password" -> nonEmptyText,
      "user_handle" -> nonEmptyText
    )(UserModel.apply)(UserModel.unapply)
  }


  val projectForm:Form[ProjectModel] = Form {
    mapping(
      "project_id" -> default(longNumber, -1L),
      "project_start_date" -> optional(sqlTimestamp),
      "project_end_date" -> optional(sqlTimestamp),
      "project_code" -> text,
      "project_name" -> text
    )(ProjectModel.apply)(ProjectModel.unapply)
  }
  val recordworkForm:Form[RecordWorkModel] = Form {
    mapping(
      "project_id" -> default(longNumber, -1L),
      "project_user_id" -> default(longNumber, -1L),
      "project_start_date" -> sqlTimestamp,
      "project_code" -> longNumber,
      "project_effort" -> of[Double]
    )(RecordWorkModel.apply)(RecordWorkModel.unapply)
  }

  def index = Action { implicit request =>
    getAuth.map { userModel =>
      Ok(views.html.index(userForm,projectForm,recordworkForm,Some(userModel)))
    }.getOrElse {
      Ok(views.html.index(userForm, projectForm,recordworkForm, None))
    }
  }

  def logout = Action { implicit request =>
    request.session.get("user").map { u =>
      Logger.info("Removed session "+u)
      cache.remove(u);
    }
    Redirect(routes.Application.index()).withNewSession
  }

  def getAuth(implicit request: play.api.mvc.Request[play.api.mvc.AnyContent]): Option[UserModel] = {
    request.session.get("user").map { u =>
      Logger.info(s"session user is ${u}")
      return cache.get[UserModel](u)
    }
    None
  }


  case class UserPassword(user_name: String, user_password: String)

  implicit val userPasswordReads = Json.reads[UserPassword]

  def login = Action.async(parse.json) { implicit request =>
    val userPassword = request.body.as[UserPassword]
    var id: Option[String] = None
    user.list(None,None).map { rows =>
      rows.filter { r => r.user_name == userPassword.user_name && r.user_password == userPassword.user_password }.map { r =>
        id = Some(java.util.UUID.randomUUID().toString)
        cache.set(id.get, r)

        Logger.info(s"login is [${id}] and db is ${r.user_name} ${r.user_handle}")
      }
      if (id.isEmpty) {
        BadRequest.withNewSession
      } else {
        Redirect(routes.Application.index()).withSession("user" -> id.get)
      }
    }
  }
}

