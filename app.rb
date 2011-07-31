require 'rubygems'
require 'sinatra'

require 'erb'
require 'pp'

get '/' do
  erb :app
end

get '/app.appcache' do
  content_type 'text/cache-manifest'
  # headers['Cache-Control'] = "public, max-age=1"
  erb :appcache
end

helpers do
  def version
    @version ||= ENV['COMMIT_HASH'] || rand(1000000000).to_s(16) # never cache in development
  end
end

before do
  puts ENV['RACK_ENV']
  if ENV['RACK_ENV'] == :production
    redirect "http://todoing.org#{request.path}" if request.host != 'todoing.org'
  end
end