require 'rubygems'
require 'sinatra'

require 'erb'

get '/' do
  erb :app
end

get '/app.appcache' do
  # cache a bit
  headers['Cache-Control'] = "public, max-age=1000"
  @gitstamp = `git show-ref | grep refs/heads/master`.gsub('refs/heads/master','')
  erb :appcache
end