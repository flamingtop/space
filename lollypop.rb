require 'sinatra'
require 'json'
require 'yaml'
require 'neography'

#class App < SInatra::Base

set :public_folder, File.dirname(__FILE__) + '/static'

before do
  headers "Content-Type" => "application/json"
end

def initialize
  @neo = Neography::Rest.new
end

get '/page/:id' do
  page = @neo.get_node_auto_index(:id, params[:id]).first['data']
  blocks = []
  blocks.push({:id => 'b-111', :top => 29, :left => 149, :text => 'hello world', :html => '<h3>hello world</h3>'})
  blocks.push({:id => 'b-222', :top => 100, :left => 30, :text => 'block 2', :html => %{\
<img src="http://www.blogcdn.com/www.thatsfit.com/media/2007/10/nendo_lollypop.jpg" width="200px" />
<center style="background-color:#333; color:#fff;padding:.2em;">Lollypop</center>
  }})
  
  headers "Content-Type" => "text/html"
  erb :index, :locals => {:page => JSON.generate(page), :blocks => JSON.generate(blocks)}
end
post '/page' do
end
put '/page/:id' do
end
delete '/page/:id' do
  @neo.delete_node(params[:id]);
end

post '/block' do
end
put '/block/:id' do
end
delete '/block/:id' do
end

#end
