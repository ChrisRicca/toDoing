require 'rubygems'
require 'sinatra'

require 'erb'

get '/' do
  erb :app
end



get '/app.appcache' do
  content_type 'text/cache-manifest'
  headers['Cache-Control'] = "public, max-age=1"
  @gitstamp = ENV['COMMIT_HASH'] || rand(1000000000).to_s(16) # never cache in development
  erb :appcache
end