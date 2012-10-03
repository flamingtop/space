require 'sinatra'
require 'json'
require 'yaml'
require './models/page.rb'

#class App < SInatra::Base

set :public_folder, File.dirname(__FILE__) + '/static'

get '/test' do
  p = Page.load_by_id('xyz123')
  p.load_blocks.to_s
end

before do
  headers "Content-Type" => "application/json"
end


get '/page/:id' do

=begin
neo4j auto unique index: not possible, too much hassel 
ruby unique id
rename the project 

:id exists 
  i can edit? load the page and continue editing
  i can't edit ? load the page, show me what I can see
:id not exist
  create the page, initialize it for editing
  create relationship between the new page and me(user)

=end

  page = Page.load_by_id(params[:id])
  blocks = page.load_blocks
  headers "Content-Type" => "text/html"
  erb :index, :locals => {:page => page.to_s, :blocks => blocks.to_s}
end
post '/page' do
end
put '/page/:id' do
end
delete '/page/:id' do
end

post '/page/:pid/block' do
  page  = Page.load_by_id(params[:pid])
  block = page.add_block JSON.parse(request.body.read)
  block.to_s
end
put '/page/:pid/block/:bid' do
end
delete '/page/:pid/block/:bid' do
  block = Block.load_by_id(params[:bid])
  block.delete
  'OK'
end

#end
