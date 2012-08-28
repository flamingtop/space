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

get '/test' do
  bbcode    = ":bbcode\n[b]bold text[/b]"
  markdown  = ":markdown\n**bold text**"
  mediawiki = ":mediawiki\n'''bold text'''"
  orgmode   = ":orgmode\n*bold text*"
  textile   = ":textile\n*bold text*"
  raw       = "*bold text*<style>\nh1 {color:red}</style><style>h2 {color:blue}</style>"
  Text.new(raw).text
end

get '/user/signup' do
  headers "Content-Type" => "text/html"
  erb :signup
end

post '/user/signup' do
  user = User.by_email(params['signup']['email'])
  return 'already exists' if user
  User.new(params['signup']).save
  'registered'
end

get '/user/signin' do
  # return 'logged in already' if session[:uid]
  headers "Content-Type" => "text/html"  
  erb :signin
end

post '/user/signin' do
  user = User.by_email_passwd(params['signin']['email'], params['signin']['password'])
  return 'wrong email or password'  if user.nil? 
  session[:uid] = user.id
end

get '/user/signout' do
end

get '/page/:slug' do
  page   = Page.by_slug(params[:slug])
  if page.nil?
    redirect '/user/signin' unless session[:uid]
    page = Page.new({:slug => params[:slug]}).save
  else
    user = User.by_id(session[:uid])
    if user.can_edit_page?(page)
      blocks = page.load_blocks
      headers "Content-Type" => "text/html"
      erb :page, :locals => {:page => page.to_s, :blocks => blocks.to_s}
    else
      'cant edit'
    end
  end
end

post '/page/:pid/block' do
  page  = Page.by_id(params[:pid])
  block = page.add_block(JSON.parse(request.body.read))
  block.to_s
end

put '/page/:pid/block/:bid' do
  block = Block.by_id(params[:bid])
  block.update(JSON.parse request.body.read)
  block.to_s
end

delete '/page/:pid/block/:bid' do
  block = Block.by_id(params[:bid])
  block.delete
  'OK'
end

#end
