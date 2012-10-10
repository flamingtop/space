# -*- coding: utf-8 -*-
require 'sinatra'
require 'json'
require 'yaml'
require './models/page.rb'

require 'unidecode'
# put in extensions.rb
String.class_eval do
  def to_slug
    self.transliterate.downcase.gsub(/[^a-z0-9 ]/, ' ').strip.gsub(/[ ]+/, '-')
  end

  # differs from the 'to_slug' method in that it leaves in the dot '.'
  # character and removes Windows' crust from paths (removes
  # "C:\Temp\" from "C:\Temp\mieczyslaw.jpg")
  def sanitize_as_filename
    self.gsub(/^.*(\\|\/)/, '').transliterate.downcase.gsub(/[^a-z0-9\. ]/, ' ').strip.gsub(/[ ]+/, '-')
  end

  def transliterate
    # Unidecode gem is missing some hyphen transliterations
    self.gsub(/[-‐‒–—―⁃−­]/, '-').to_ascii
  end
end


def return_html
  content_type 'text/html', :charset => 'utf-8'
end
def return_json
  content_type 'application/json', :charset => 'utf-8'
end



#class App < SInatra::Base

enable :sessions # not the best way

set :public_folder, File.dirname(__FILE__) + '/static'

before do
  return_json
end

get '/user/signup' do
  return_html
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
  return_html
  erb :signin
end

post '/user/signin' do
  user = User.by_email_passwd(params['signin']['email'], params['signin']['password'])
  return 'wrong email or password'  if user.nil? 
  session[:uid] = user.id
end

get '/user/signout' do
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

get '/page/new' do
  redirect '/page/' + params['title'] if params.key? 'title'
  return_html
  erb :page_new
end

get '/page/*' do
  return_html
  
  title = params[:splat].first
  slug = title.to_slug
  page  = Page.by_slug(slug)
  user = User.by_id(session[:uid])
  
  if page.nil?
    if user.can_create_page?
      page = Page.new({:slug => slug, :title => title}).save
      erb :page, :locals => {:page => page.to_s, :blocks => [].to_s}
    else
      redirect '/user/signin'      
    end
  else
    if user.can_edit_page? page
      blocks = page.load_blocks
      erb :page, :locals => {:page => page.to_s, :blocks => blocks.to_s}
    else
      "Sorry, you are not authorized to edit this page."
    end
  end
end


#end
