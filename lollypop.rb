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
  if !request.xhr? 
    headers "Content-Type" => "text/html"
    return erb :index, :locals => {:page_id => params[:id]}
  end
  return JSON.pretty_generate @neo.get_node_auto_index(:id, params[:id]).first['data']
#  @neo.execute_query("start n=node:node_auto_index(id='xyz123') return n").to_s
#  @neo.list_node_indexes.to_s
#  query = "start n=node() return n";
#  nodes = @neo.execute_query(query, {})
#  nodes['data'].first.first['data'].to_s
#  nodes['data'].to_s
end

post '/page' do
  page = {
    :type   => "page",
    :title  => "Page 1",
    :width  => "auto",
    :height => "auto"
  }
  neo = Neography::Rest.new
  #node = neo.create_node(page);
  #YAML::dump(node)
  node = neo.get_node(9)
  #neo.set_node_properties(node, {"points" => 400, "title" => "Page 2", "foo" => ['b', 'a', 'r']})
  YAML::dump(node)
end

put '/page/:id' do
end

delete '/page/:id' do
  neo = Neography::Rest.new
  neo.delete_node(params[:id]);
end

post '/block' do
end
put '/block/:id' do
end
delete '/block/:id' do
end

#end
