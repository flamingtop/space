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

  
get '/user/signup' do
  headers "Content-Type" => "text/html"
  erb :signup
end

post '/user/signup' do
  user = User.by_email(params['signup']['email'])
  return 'already exists' if user
  user = User.new(params['signup'])
  user.save
  'registered'
end

get '/user/signin' do
  
end

get '/user/signout' do
 
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
