require 'neography'
require 'json'


class Node

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

  @@db = Neography::Rest.new
  
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
  
  def isNew?
    !@id
  end

  def save
    if isNew?
      @id = Time.new.usec
      node = @@db.create_node(to_hash)
      @node = node
    else
      @@db.set_node_properties(@node, to_hash)
    end
  end

  def self.load_by_id(id)
    r = @@db.get_node_auto_index(:id, id)
    n = self.new(r.first['data'])
    n.node = r.first
    n
  end

  protected
  

  # populate node variables from a hash or json object
  def reset(data)
    if !data.is_a?(Hash)
      data = JSON.parse data
    end
    data = Hash[data.map {|k,v| k.respond_to?(:to_sym) ? [k.to_sym, v] : [k, v]}]
    schema.each do |f|
      self.class.send(:attr_accessor, f[:field])
      value = data[f[:field]] || (isNew? ? f[:default] : instance_variable_get('@'+f[:field].to_s))
      instance_variable_set( '@'+f[:field].to_s, value)
    end
    self
  end

end


class Page < Node

  def schema
    [{:field => :id     , :default => nil},
     {:field => :type   , :default => NODE_TYPE_PAGE},
     {:field => :title  , :default => 'untitled'},
     {:field => :width  , :default => 'auto'},
     {:field => :height , :default => 'auto'},
     {:field => :style  , :default => ''}]
  end
  
  def load_blocks()
    blocks = []
    query = "start n=node:node_auto_index(id='#{@id}') match n-[#{R_HAS_BLOCK}]->m return m";
    @@db.execute_query(query)['data'].each do |item|
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
    @@db.create_relationship(R_HAS_BLOCK, @node, block.node)
    block
  end
  
  def delete_block(block)
    block.delete
  end
  
end



class Block < Node
  
  def schema
    [{:field => :id     , :default => nil},
     {:field => :type   , :default => NODE_TYPE_BLOCK},
     {:field => :top    , :default => 0},
     {:field => :left   , :default => 0},
     {:field => :width  , :default => 'auto'},
     {:field => :height , :default => 'auto'},
     {:field => :text   , :default => 'EMPTY'},
     {:field => :html   , :default => 'EMPTY'},            
     {:field => :style  , :default => ''}]
  end
  
  def update(data)
    reset(data).save
  end
  
  def delete
    @@db.delete_node!(@node)
  end
  
end



class User < Node

  def schema
    [{:field => 'type'         , :default => NODE_TYPE_USER},
     {:field => 'email'        , :default => nil},
     {:field => 'passowrd'     , :default => nil},
     {:field => 'display_name' , :default => nil}]
  end

  def add_to_group(group)
    @@db.create_relationship(R_IN_GROUP, @node, group.node)
  end

end



class Group < Node
  
  def schema
    [{:field => 'type' , :default => NODE_TYPE_GROUP},
     {:field => 'name' , :default => ''}]
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
