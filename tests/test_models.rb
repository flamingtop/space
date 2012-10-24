require 'test/unit'
require '../models/page.rb'

Neography.configure do |config|
  config.protocol       = "http://"
  config.server         = "localhost"
  config.port           = 7476
  config.directory      = ""  # prefix this path with '/' 
  config.cypher_path    = "/cypher"
  config.gremlin_path   = "/ext/GremlinPlugin/graphdb/execute_script"
  config.log_file       = "neography.log"
  config.log_enabled    = false
  config.max_threads    = 20
  config.authentication = nil  # 'basic' or 'digest'
  config.username       = nil
  config.password       = nil
  config.parser         = {:parser => MultiJsonParser}
end

class TestBase < Test::Unit::TestCase
  def setup
    Node.db = Neography::Rest.new
    Node.db.execute_query("start n=node(*) delete n;");
  end
  def teardown
    Node.db = nil
  end
end

class TestUser < TestBase

  def test_user_create
    user = create_user
    the_user = User.by_id(user.id)
    assert_equal the_user.id, user.id
    assert_equal the_user.email, user.email
    assert_equal the_user.display_name, user.display_name
  end

  def test_user_update
    new_display_name = 'test_user_changed'
    new_email = 'test_changed@domain.com'
    new_password = 'password_changed'
    user = create_user
    user.email = new_email
    user.password = new_password
    user.display_name = new_display_name
    user.save
    the_user = User.by_email(user.email)
    assert the_user.email != new_email
    assert_equal the_user.password, the_user.gen_password(new_password)
    assert_equal the_user.display_name, new_display_name
  end

  def test_user_delete
    user = create_user
    user.delete
    the_user = User.by_id(user.id)
    assert !the_user.nil?
  end


  private
  def create_user
    data = {
      :email => 'test@domain.com',
      :password => 'password',
      :display_name =>'test'
    }
    User.new(data).save
  end
end

class TestPage < TestBase
  def test_page_create
    page = create_page
    the_page = Page.by_slug(page.slug)
    assert_equal the_page.id, page.id
    assert_equal the_page.title, page.title
  end

  def test_page_update
  end

  def test_page_delete
  end

  private
  def create_page
    data = {
      :raw => %{
<title>test title</title>
<tags>tag1, tag2, tag3</tags>
page description
}
    }
    page = Page.new(data).save
  end
end
