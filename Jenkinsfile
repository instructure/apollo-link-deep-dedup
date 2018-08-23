CHANNEL_NAME = '#pandalytics-cr'
SUCCEEDED_EMOJI = ':happystar:'
FAILED_EMOJI = ':x:'

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
                sh 'npm install && npm run build'
            }
        }
        stage('Run Linter') {
            steps {
                echo 'Running Linter...'
                sh 'npm run lint'
            }
        }
        stage('Test') {
            steps {
                echo 'Testing...'
                sh 'npm test'
            }
        }
    }
    post {
        success {
            slackSend (
                channel: CHANNEL_NAME,
                color: 'good',
                message: "SUCCEEDED: ${env.JOB_NAME} [${env.BUILD_NUMBER}] (${env.BUILD_URL}) ${SUCCEEDED_EMOJI}"
            )
        }
        failure {
            slackSend (
                channel: CHANNEL_NAME,
                color: 'danger',
                message: "FAILED: ${env.JOB_NAME} [${env.BUILD_NUMBER}] (${env.BUILD_URL}) ${FAILED_EMOJI}"
            )
        }
    }
}
