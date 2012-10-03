require 'neography'
require 'json'

class Node
  @@neo = Neography::Rest.new

  attr_reader :schema
  attr_accessor :node
  
  def initialize(schema, data)
    @schema = schema
    if !data.is_a?(Hash)
      data = JSON.parse data
    end
    data = Hash[data.map {|k,v| k.respond_to?(:to_sym) ? [k.to_sym, v] : [k, v]}]
    @schema.each do |f|
      self.class.send(:attr_accessor, f[:field])
      instance_variable_set( '@'+f[:field].to_s, data[f[:field]] || f[:default]);
    end
  end
  def to_hash
    hash = {}
    @schema.each do |f|
      hash[f[:field]] = instance_variable_get('@'+f[:field].to_s)
    end
    hash
  end
  def to_s
    JSON.generate to_hash
  end
  def to_ps
    JSON.pretty_generate to_hash
  end
  def isNew?
    !@id
  end
  def save
    if isNew?
      @id = Time.new.usec
      node = @@neo.create_node(to_hash)
      @node = node
    else
      @@neo.set_node_properties(node, to_hash)
    end
  end
end

class Page < Node
  Schema = [{:field => :id, :default => nil},
            {:field => :type, :default => 'page'},
            {:field => :title, :default => 'untitled'},
            {:field => :width, :default => 'auto'},
            {:field => :height, :default => 'auto'},
            {:field => :style, :default => ''}]
  def initialize(data)
    super(Schema, data)
  end
  def self.load_by_id(id)
    node = @@neo.get_node_auto_index(:id, id)
    return false if !node.length
    page = Page.new(node.first['data'])
    page.node = node.first
    page
  end
  def load_blocks()
    blocks = []
    query = "start n=node:node_auto_index(id='#{@id}') match n-[:has_block]->m return m";
    @@neo.execute_query(query)['data'].each do |item|
      blocks.push Block.new(item.first['data'])
    end
    blocks
  end
  def add_block(block)
    save if isNew?
    if !block.is_a? Block
      block = Block.new(block)
      block.save
    end
    puts block.node.to_s
    @@neo.create_relationship('has_block', node, block.node)
    block
  end
  def delete_block(block)
    
  end
end

class Block < Node
  Schema = [{:field => :id, :default => nil},
            {:field => :type, :default => 'block'},
            {:field => :top, :default => 0},
            {:field => :left, :default => 0},
            {:field => :width, :default => 'auto'},
            {:field => :height, :default => 'auto'},
            {:field => :text, :default => 'EMPTY'},
            {:field => :html, :default => 'EMPTY'},            
            {:field => :style, :default => ''}]
  def initialize(data)
    super(Schema, data)
  end
  def self.load_by_id(id)
    node = @@neo.get_node_auto_index(:id, id)
    puts id
    puts node.to_s
    return false if !node.length
    block = Block.new(node.first['data'])
    block.node = node.first
    block
  end
  def delete
    @@neo.delete_node!(@node)
  end
end
