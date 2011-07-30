require 'rubygems'
require 'sinatra'

require 'erb'

get '/' do
  erb :app
end

get '/app.appcache' do
  # cache a bit
  content_type :appcache
  headers['Cache-Control'] = "public, max-age=1"
  @gitstamp = ENV['COMMIT_HASH'] || `git show-ref | grep refs/heads/master`.gsub('refs/heads/master','')
  erb :appcache
end

get '/test' do
  ENV['COMMIT_HASH']
end

configure do
  mime_type :appcache, 'text/cache-manifest'
end