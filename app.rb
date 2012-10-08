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

get '/page/*' do
  slug = params[:splat].first.to_slug
  page   = Page.by_slug(slug)
  if page.nil?
    redirect '/user/signin' unless session[:uid]
    page = Page.new({:slug => slug}).save
  else
    user = User.by_id(session[:uid])
    if user.can_edit_page?(page)
      blocks = page.load_blocks
      return_html
      erb :page, :locals => {:page => page.to_s, :blocks => blocks.to_s}
    else
      'cant edit'
    end
  end
end


#end
