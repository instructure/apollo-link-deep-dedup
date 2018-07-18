pipeline {
    agent any

    stages {
        stage('Setup') {
            steps {
                echo 'setting up....'
                sh 'sudo apt-get update && sudo apt-get -y upgrade'
                sh 'curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -'
                sh 'sudo apt-get install -y nodejs'
            }
        }
        stage('Build') {
            steps {
                echo 'Building....'
                sh 'npm install && npm start && npm build'
            }
        }
        stage('Test') {
            steps {
                echo 'Running linter...'
                sh 'npm run lint'
                echo 'Testing...'
                sh 'npm run test'
            }
        }
    }
}
