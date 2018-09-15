package controllers

import com.google.inject.AbstractModule

class Module extends AbstractModule {
  def configure() = {
    bind(classOf[org.bjason.tracking.project.controllers.CrudActionTrait]) .to(classOf[SecuredCrudResource])
    bind(classOf[org.bjason.tracking.user.controllers.CrudActionTrait]) .to(classOf[SecuredCrudUser])
    bind(classOf[org.bjason.tracking.recordwork.controllers.CrudActionTrait]) .to(classOf[SecuredCrudResource])
  }
}
