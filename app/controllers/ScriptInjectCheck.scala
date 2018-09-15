package controllers

import org.bjason.tracking.project.tables.DateConvert
import play.api.Logger
import play.api.libs.json._
import play.twirl.api.HtmlFormat

abstract class ScriptInjectCheck extends DateConvert {

  implicit object stringValid extends Format[String] {
    def reads(json: JsValue) = {
      val s = json match {
        case JsString(s) => {
          if ( s != HtmlFormat.escape(s).toString ) {
            Logger.warn("Possible hack data");
            JsError.apply("No funny characters please");
          } else {
            JsSuccess(s);
          }
        }
        case _ => JsError.apply("What >")
      }
      s
    }

    def writes(ts: String) = {
      JsString(ts)
    }
  }

}
