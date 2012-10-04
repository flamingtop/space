require 'sinatra'
require 'json'
require 'yaml'
require './models/page.rb'

#class App < SInatra::Base

enable :sessions # not the best way

set :public_folder, File.dirname(__FILE__) + '/static'

before do
  headers "Content-Type" => "application/json"
end

get '/user' do
=begin
User
email, password
password or not?
for different use cases
  - anonymouse
  - single user
  - multi-user
=end
end

get '/page/:id' do
  # user.can_edit
  page   = Page.load_by_id(params[:id])
  blocks = page.load_blocks
  headers "Content-Type" => "text/html"
  erb :page, :locals => {:page => page.to_s, :blocks => blocks.to_s}
end

post '/page/:pid/block' do
  # TODO
  page  = Page.load_by_id(params[:pid])
  block = page.add_block JSON.parse(request.body.read)  
  block.to_s
end

put '/page/:pid/block/:bid' do
  block = Block.load_by_id(params[:bid])
  block.update(JSON.parse request.body.read)
  block.to_s
end

delete '/page/:pid/block/:bid' do
  block = Block.load_by_id(params[:bid])
  block.delete
  'OK'
end

#end
