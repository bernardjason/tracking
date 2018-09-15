import org.scalatest._
import org.scalatestplus.play._
import org.scalatestplus.play.guice.GuiceOneServerPerSuite
import play.api.libs.ws.WSClient
import play.api.test.Helpers._
import play.api.libs.json._
import org.scalatest.Matchers._
import play.Configuration
import play.api.Play


class SimpleTest extends PlaySpec with GuiceOneServerPerSuite with BeforeAndAfter {

  val myPublicAddress = s"localhost:$port"

  before {
    def deleteRecordwork = {
      val wsClient = app.injector.instanceOf[WSClient]
      val baseUrl = s"http://$myPublicAddress/tables/recordwork"
      val response = await(wsClient.url(baseUrl).get())
      val json: JsArray = Json.parse(response.body).as[JsArray]
      for (j <- json.value) {
        val recordwork_id = j \ "recordwork_id"
        val deleteUrl = s"$baseUrl/${recordwork_id.get}"
        val response = await(wsClient.url(deleteUrl).delete())
        assert(response.status == OK)
      }
    }

    def deleteProject = {
      val wsClient = app.injector.instanceOf[WSClient]
      val baseUrl = s"http://$myPublicAddress/tables/project"
      val response = await(wsClient.url(baseUrl).get())
      val json: JsArray = Json.parse(response.body).as[JsArray]
      for (j <- json.value) {
        val project_id = j \ "project_id"
        val deleteUrl = s"$baseUrl/${project_id.get}"
        val response = await(wsClient.url(deleteUrl).delete())
        assert(response.status == OK)
      }
    }

    deleteRecordwork
    deleteProject
  }

  def getUserId(user_name: String) = {

    val wsClient = app.injector.instanceOf[WSClient]
    val myPublicAddress = s"localhost:$port"
    val testPaymentGatewayURL = s"http://$myPublicAddress/tables/user/user_name/${user_name}"
    val response = await(wsClient.url(testPaymentGatewayURL).get())
    val json = Json.parse(response.body).as[JsArray]
    (json.value(0) \ "user_id").as[Int]
  }

  def createRecordWorkEntry(user: String) = {
    val wsClient = app.injector.instanceOf[WSClient]
    val baseUrl = s"http://$myPublicAddress/tables/recordwork"
    val data = Json.obj(
      "recordwork_user_id" -> getUserId(user),
      "recordwork_start_date" -> "2018-01-31",
      "recordwork_project_id" -> 1,
      "recordwork_effort" -> 37.5
    )
    await(wsClient.url(baseUrl).post(data))
  }

  "The simple get to index page trait" must {
    "test server logic" in {
      val wsClient = app.injector.instanceOf[WSClient]
      val myPublicAddress = s"localhost:$port"
      val testPaymentGatewayURL = s"http://$myPublicAddress"
      val response = await(wsClient.url(testPaymentGatewayURL).get())
      response.status mustBe (OK)
    }
  }

  def withCreateEntry(doTest: => Unit) {
    for (i <- 1 to 4) {
      val wsClient = app.injector.instanceOf[WSClient]
      val baseUrl = s"http://$myPublicAddress/tables/project"
      val data = Json.obj(
        "project_code" -> s"PROJ000${i}",
        "project_name" -> s"Project Fred"
      )
      val response = await(wsClient.url(baseUrl).post(data))
    }
    doTest
  }


  "that a simple,get " must {
    "get an entry " in withCreateEntry {
      val wsClient = app.injector.instanceOf[WSClient]
      val baseUrl = s"http://$myPublicAddress/tables/project"
      val responseGet = await(wsClient.url(baseUrl).get())
      responseGet.status mustBe (OK)
      val json: JsArray = Json.parse(responseGet.body).as[JsArray]
      for (j <- json.value) {
        (j \ "project_code").as[String] should startWith("PROJ000")
      }
      json.value.length should equal(4)
    }

  }

  "that a get with a where clause " must {
    "get a list back where PROJECT_CODE = PROJ0001 " in withCreateEntry {
      val wsClient = app.injector.instanceOf[WSClient]
      val baseUrl = s"http://$myPublicAddress/tables/project/project_code/PROJ0001"
      val responseGet = await(wsClient.url(baseUrl).get())
      responseGet.status mustBe (OK)
      println(" GOT BACK " + responseGet.body)
      val json = Json.parse(responseGet.body).as[JsArray]
      for (j <- json.value) {
        (j \ "project_name").as[String] should equal("Project Fred")
      }
      json.value.length should equal(1)
    }
  }

  "that a get with primary key " must {
    "get one entry " in withCreateEntry {
      val wsClient = app.injector.instanceOf[WSClient]
      val baseUrl = s"http://$myPublicAddress/tables/project/1"
      val responseGet = await(wsClient.url(baseUrl).get())
      responseGet.status mustBe (OK)
      println(" GOT BACK " + responseGet.body)
      val json = Json.parse(responseGet.body).as[JsObject]
      (json \ "project_id").as[Int] should equal(1)
    }
  }

  "create a record work item " must {
    "have 1 entry for user bernard" in withCreateEntry {

      val response = createRecordWorkEntry("bernard")
      val json = Json.parse(response.body).as[JsObject]
      (json \ "recordwork_id").as[Int] should equal(1)
    }
  }

  "create lots of entries " must {
    "make sure entries for each user retruned " in withCreateEntry {
      for (i <- 1 to 3) {
        val response = createRecordWorkEntry("bernard")
        val json = Json.parse(response.body).as[JsObject]
        (json \ "recordwork_id").as[Int] should equal(i)
      }
      for (i <- 1 to 3) {
        val response = createRecordWorkEntry("tea")
        val json = Json.parse(response.body).as[JsObject]
        (json \ "recordwork_id").as[Int] should equal(i + 3)
      }

      def checkUser(user: String): Unit = {

        val user_id = getUserId(user);
        val wsClient = app.injector.instanceOf[WSClient]
        val baseUrl = s"http://$myPublicAddress/tables/recordwork/recordwork_user_id/${user_id}"
        val responseGet = await(wsClient.url(baseUrl).get())
        responseGet.status mustBe (OK)
        println(" GOT BACK " + responseGet.body)
        val json = Json.parse(responseGet.body).as[JsArray]
        json.value.length mustBe 3
      }
      checkUser("bernard");
      checkUser("tea");

    }

  }


}
