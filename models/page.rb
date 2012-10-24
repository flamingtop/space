# -*- coding: utf-8 -*-
require 'neography'
require 'json'
require 'base32/crockford'
require 'nokogiri'
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

class Text
  attr_accessor :raw, :html, :clean 
  attr_accessor :type, :style, :title, :tags, :slug
  def initialize(text)
    @raw = text
    @html = ''
    @clean = ''
    @title = ''
    @type = ''
    @style = ''
    @slug = ''
    @tags = []
    extract
  end

  def extract
    doc = Nokogiri::HTML.fragment(@raw)
    doc.css('title').each do |ele|
      @title = ele.text.strip
      @slug = @title.to_slug
      ele.remove()
    end
    doc.css('slug').each do |ele|
      slug = ele.text.strip.to_slug
      @slug = slug if slug.length
      ele.remove()
    end
    doc.css('style').each do |ele|
      @style += ele
      ele.remove()
    end
    doc.css('type').each do |ele|
      @type = ele.text.strip.downcase
      ele.remove()
    end
    doc.css('tags').each do |ele|
      @tags = ele.text.split(',').map! {|tag| tag.strip}
      ele.remove()
    end
    @clean = doc.to_html
  end

  def to_html
    case @type
    when 'bbcode'
      require 'bb-ruby'
      @html = @clean.bbcode_to_html
    when 'markdown', 'md'
      require 'maruku'
      @html = Maruku.new(@clean).to_html
    when 'mediawiki', 'mwiki'
      require 'wikicloth'
      @html = WikiCloth::Parser.new({:data => @clean}).to_html
    when 'orgmode', 'org'
      require 'org-ruby'
      @html = Orgmode::Parser.new(@clean).to_html
    when 'textile', 'tt'
      require 'RedCloth'
      @html = RedCloth.new(@clean).to_html
    else
      @html = '<pre>' + @clean + '</pre>'
    end
  end
end

class Node
  attr_reader :old

  # node types
  NODE_TYPE_PAGE  = :page
  NODE_TYPE_BLOCK = :block
  NODE_TYPE_USER  = :user
  NODE_TYPE_GROUP = :group

  # relationship types
  R_HAS_BLOCK                  = :HAS_BLOCK
  R_IN_GROUP                   = :IN_GROUP
  R_CAN_READ_PAGE              = :CAN_READ_PAGE
  R_CAN_EDIT_PAGE              = :CAN_EDIT_PAGE
  R_CAN_EDIT_PAGE_ADD_BLOCK    = :CAN_EDIT_PAGE_ADD_BLOCK
  R_CAN_EDIT_PAGE_EDIT_BLOCK   = :CAN_EDIT_PAGE_EDIT_BLOCK
  R_CAN_EDIT_PAGE_DELETE_BLOCK = :CAN_EDIT_PAGE_DELETE_BLOCK

  # indexes
  IDX_NODE    = :nodes
  IDX_USER    = :users
  IDX_PAGE    = :pages

  # common fields
  F_ID = {:field => :id, :default => nil, :config => [:id]}

  @@db = Neography::Rest.new

  def self.db=(db)
    @@db = db
  end

  def self.db
    @@db
  end

  attr_accessor :node
  
  def initialize(data)
    reset data
  end

  def to_hash
    hash = {}
    schema.each do |f|
      hash[f[:field]] = instance_variable_get('@'+f[:field].to_s)
    end
    hash
  end

  def to_s
    JSON.generate to_hash
  end
  
  def is_new?
    !@id
  end

  def gen_id
    Base32::Crockford.encode(rand(10**7) + Time.new.usec)
  end

  def before_save
  end

  def changed? property
    instance_variable_get('@'+property.to_s) != @old[property]
  end

  def save
    if is_new?
      @id = gen_id
      before_save      
      @node = create
      new_node =  self.class.new(@node)
      if new_node.id == @id
        # it's a fresh node, otherwise an existing node is returned
        @@db.add_node_to_index(IDX_NODE, :id, @id, @node)
      else
        return new_node
      end
    else
      before_save
      @@db.set_node_properties(@node, to_hash)
    end
    self
  end

  def create
    @@db.create_node(to_hash)
  end

  def self.by_id(id)
    begin
      node = @@db.get_node_index(IDX_NODE, :id, id).first
    rescue => ex
      nil
    else
      node.nil? ? nil : self.new(node)
    end
  end

  # populate node variables from a hash or json object
  def reset(data)
    @old = {}
    # data is a Neo Rest response
    if data.is_a? Hash and data.key? 'all_relationships' and data.key? 'data'
      @node = data
      data = data['data']
    end

    if !data.is_a? Hash
      data = JSON.parse data
    end
    data = Hash[data.map {|k,v| k.respond_to?(:to_sym) ? [k.to_sym, v] : [k, v]}]
    schema.each do |f|
      self.class.send(:attr_accessor, f[:field])
      value = data[f[:field]] || (is_new? ? f[:default] : instance_variable_get('@'+f[:field].to_s))
      instance_variable_set( '@'+f[:field].to_s, value)
      @old[f[:field]] = value
    end
    self
  end

  def delete
    @@db.delete_node!(@node)
  end
end


class Page < Node
  def schema
    [{:field => :slug   , :default => ''},
     {:field => :type   , :default => NODE_TYPE_PAGE},
     {:field => :title  , :default => 'untitled'},
     {:field => :width  , :default => '100%'},
     {:field => :height , :default => 'auto'},
     {:field => :tags   , :default => [].to_s},
     {:field => :raw    , :default => ''},
     {:field => :html   , :default => ''},     
     {:field => :style  , :default => ''}] << F_ID
  end

  def self.by_slug(slug)
    begin
      page = @@db.get_node_index(IDX_PAGE, :slug, slug).first
    rescue => ex
      nil
    else
      # neography doesn't always throw Erros
      # exception handling might not work
      page.nil? ? nil : Page.new(page)
    end
  end

  def create
    @@db.create_unique_node(IDX_PAGE, :slug, @slug, to_hash)
  end

  def before_save
    t = Text.new(@raw)
    @style = t.style
    @title = t.title
    @slug = t.slug
    @tags  = JSON.generate t.tags
    @html  = t.to_html
  end
  
  def load_blocks()
    blocks = []
    query = "start n=node:#{IDX_NODE}(id='#{@id}') match n-[#{R_HAS_BLOCK}]->m return m";    @@db.execute_query(query)['data'].each do |item|
      blocks.push Block.new(item.first['data'])
    end
    blocks
  end
  
  def add_block(block)
    save if is_new?
    if !block.is_a? Block
      block = Block.new(block)
      block.save
    end
    @@db.create_relationship(R_HAS_BLOCK, @node, block.node)
    block
  end
  
  def delete_block(block)
    block.delete
  end
end

class Block < Node
  def schema
    [{:field => :type   , :default => NODE_TYPE_BLOCK},
     {:field => :title  , :default => ''},                 
     {:field => :top    , :default => 0},
     {:field => :left   , :default => 0},
     {:field => :width  , :default => 'auto'},
     {:field => :height , :default => 'auto'},
     {:field => :raw    , :default => 'EMPTY'},
     {:field => :html   , :default => 'EMPTY'},
     {:field => :tags   , :default => ''},                 
     {:field => :style  , :default => ''}] << F_ID
  end

  def before_save
    if changed? :raw
      t = Text.new(@raw)
      @style = t.style
      @title = t.title
      @tags  = JSON.generate t.tags
      @html  = t.to_html
    end
  end
end


class User < Node
  def schema
    [{:field => :type         , :default => NODE_TYPE_USER},
     {:field => :email        , :default => nil},
     {:field => :password     , :default => nil},
     {:field => :display_name , :default => nil}] << F_ID
  end

  def self.by_id(id)
    super(id) || AnonymousUser.new
  end  

  def add_to_group(group)
    @@db.create_relationship(R_IN_GROUP, @node, group.node)
  end

  def anonymous?
    @anonymous
  end

  def self.by_email(email)
    begin 
      node = @@db.get_node_index(IDX_USER, :email, email).first
    rescue => ex
      AnonymousUser.new
    else
      node.nil? ? AnonymousUser.new : User.new(node)
    end
  end

  def self.by_email_passwd(email, password)
    user = by_email(email)
    return false if user.anonymous?
    user.password != password ? false : user
  end
  
  def create
    @@db.create_unique_node(IDX_USER, :email, @email, to_hash)
  end

  def gen_password password
    require 'digest/sha1'
    @password = Digest::SHA1.hexdigest password+@id
  end

  def before_save
    if changed? :password
      gen_password @password
    end
    if changed? :email
      # changing email not allowed
      @email = @old[:email]
    end
  end

  def can_edit_page?(page)
    true
  end

  def can_create_page?
    true
  end
end

class AnonymousUser < User
  def initialize
    @anonymous = true
    super({:display_name => 'Anonymous'})
  end
  def save
    raise 'Anonymous user shouldn\'t be saved.'
  end
end

class Group < Node
  def schema
    [{:field => :type , :default => NODE_TYPE_GROUP},
     {:field => :name , :default => ''}]
  end

  def set_perm(rel, anynode)
    @@db.create_relationship(rel, @node, anynode.node)
  end

  def unset_perm(rel, anynode)
    @@db.delete_relationship(rel, @node, anynode.node)
  end

  def can_edit_page=(page, yn)
    if yn
      set_perm(R_CAN_EDIT_PAGE, page.node)
    else
      unset_perm(R_CAN_EDIT_PAGE, page.node)
    end
  end

  def can_edit_page?(page)
    
  end
end
