CHANNEL_NAME = '#pandalytics-cr'
committerName = ''

pipeline {
    agent {
        docker {
            image 'node:8-alpine'
        }
    }
    stages {
        stage('Build') {
            steps {
                echo 'Building....'
                sh 'npm install && npm run bootstrap && npm run build'
            }
        }

        stage('Test') {
            steps {
                echo 'Running linter...'
                sh 'npm run lint'
                echo 'Testing...'
                sh 'npm run start & npm run test'
            }
        }
    }
    post {
        success {
            slackSend (
                channel: CHANNEL_NAME,
                color: 'good',
                message: "SUCCEEDED: ${env.JOB_NAME} [${env.BUILD_NUMBER}] (${env.BUILD_URL}) :happystar:"
            )
        }

        failure {
            slackSend (
                channel: CHANNEL_NAME,
                color: 'danger',
                message: "FAILED: ${env.JOB_NAME} [${env.BUILD_NUMBER}] (${env.BUILD_URL}) :u7981:"
            )
        }
    }
}
